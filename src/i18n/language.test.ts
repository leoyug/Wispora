import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultAppLanguage, getAppLanguage, resolveAppLanguage, setAppLanguage } from "./language";

afterEach(() => vi.unstubAllGlobals());

describe("app language", () => {
  it("defaults to Simplified Chinese and persists a supported future selection", async () => {
    const values: Record<string, unknown> = {};
    vi.stubGlobal("browser", { storage: { local: {
      async get(key: string) { return key in values ? { [key]: values[key] } : {}; },
      async set(next: Record<string, unknown>) { Object.assign(values, next); },
    } } });

    await expect(getAppLanguage()).resolves.toBe(defaultAppLanguage);
    await setAppLanguage("en-US");
    await expect(getAppLanguage()).resolves.toBe("en-US");
  });

  it("ignores unsupported stored values", async () => {
    vi.stubGlobal("browser", { storage: { local: {
      async get() { return { "wanderland.interface.language": "unsupported" }; },
      async set() {},
    } } });

    await expect(getAppLanguage()).resolves.toBe("zh-CN");
  });

  it("resolves system preference from the browser language", () => {
    expect(resolveAppLanguage("system", "zh-HK")).toBe("zh-CN");
    expect(resolveAppLanguage("system", "en-GB")).toBe("en-US");
    expect(resolveAppLanguage("zh-CN", "en-GB")).toBe("zh-CN");
  });

  it("synchronizes extension changes and re-resolves Follow system without reinitializing listeners", async () => {
    vi.resetModules();
    const language = await import("./language");
    let storageListener: (changes: Record<string, { newValue: unknown }>, area: string) => void = () => {};
    const events = new Map<string, () => void>();
    const addListener = vi.fn((listener: typeof storageListener) => { storageListener = listener; });
    const navigator = { languages: ["en-GB"] };
    vi.stubGlobal("navigator", navigator);
    vi.stubGlobal("document", { documentElement: { lang: "" } });
    vi.stubGlobal("window", { addEventListener: (name: string, listener: () => void) => events.set(name, listener) });
    vi.stubGlobal("browser", { storage: {
      local: { async get() { return { [language.APP_LANGUAGE_KEY]: "system" }; } },
      onChanged: { addListener },
    } });
    await language.initializeLanguage();
    await language.initializeLanguage();
    expect(addListener).toHaveBeenCalledTimes(1);
    expect(language.getAppLanguageSnapshot()).toBe("en-US");
    const listener = vi.fn();
    const unsubscribe = language.subscribeLanguage(listener);
    navigator.languages = ["zh-TW"];
    events.get("languagechange")?.();
    expect(document.documentElement.lang).toBe("zh-CN");
    storageListener({ [language.APP_LANGUAGE_KEY]: { newValue: "en-US" } }, "local");
    expect(document.documentElement.lang).toBe("en-US");
    storageListener({ [language.APP_LANGUAGE_KEY]: { newValue: "zh-CN" } }, "sync");
    expect(language.getAppLanguageSnapshot()).toBe("en-US");
    unsubscribe();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("persists and synchronizes the web preview preference across tabs", async () => {
    vi.resetModules();
    const language = await import("./language");
    const values = new Map<string, string>();
    const localStorage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
    let onStorage: (event: { storageArea: unknown; key: string | null; newValue: string | null }) => void = () => {};
    vi.stubGlobal("browser", undefined);
    vi.stubGlobal("localStorage", localStorage);
    vi.stubGlobal("window", { addEventListener: (name: string, listener: typeof onStorage) => { if (name === "storage") onStorage = listener; } });
    await language.initializeLanguage();
    await language.setLanguagePreference("en-US");
    expect(values.get(language.APP_LANGUAGE_KEY)).toBe("en-US");
    onStorage({ storageArea: localStorage, key: "unrelated", newValue: "zh-CN" });
    expect(language.getAppLanguageSnapshot()).toBe("en-US");
    onStorage({ storageArea: localStorage, key: language.APP_LANGUAGE_KEY, newValue: "zh-CN" });
    expect(language.getAppLanguageSnapshot()).toBe("zh-CN");
    onStorage({ storageArea: localStorage, key: language.APP_LANGUAGE_KEY, newValue: "en-US" });
    onStorage({ storageArea: localStorage, key: null, newValue: null });
    expect(language.getLanguagePreferenceSnapshot()).toBe("zh-CN");
  });

  it("applies the capture overlay language without changing the host document or its storage", async () => {
    vi.resetModules();
    const language = await import("./language");
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { setItem });
    vi.stubGlobal("document", { documentElement: { lang: "ja" } });
    language.applyLanguagePreference("en-US");
    expect(language.getAppLanguageSnapshot()).toBe("en-US");
    expect(document.documentElement.lang).toBe("ja");
    expect(setItem).not.toHaveBeenCalled();
  });
});
