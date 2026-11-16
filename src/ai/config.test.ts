import { afterEach, describe, expect, it, vi } from "vitest";
import { aiProviderPresets } from "./presets";
import { getAiCredentials, getAiSettings, getAiTestCredentials, hardenAiCredentialStorage, saveAiSettings } from "./config";

function storageArea() {
  const values: Record<string, unknown> = {};
  const setAccessLevel = vi.fn().mockResolvedValue(undefined);
  return {
    values,
    setAccessLevel,
    async get(keys: string | string[] | null) {
      const selected = keys === null ? Object.keys(values) : Array.isArray(keys) ? keys : [keys];
      return Object.fromEntries(selected.filter((key) => key in values).map((key) => [key, values[key]]));
    },
    async set(next: Record<string, unknown>) { Object.assign(values, next); },
    async remove(keys: string | string[]) { for (const key of Array.isArray(keys) ? keys : [keys]) delete values[key]; },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("AI settings storage", () => {
  it("keeps session keys out of local storage and migrates them without exposing the value", async () => {
    const local = storageArea();
    const session = storageArea();
    vi.stubGlobal("browser", { storage: { local, session } });

    await saveAiSettings({ enabled: true, provider: "custom", endpoint: "https://api.example.com/v1/", model: "model", apiKeyStorage: "session", apiKey: "secret" });
    expect(Object.values(local.values)).not.toContain("secret");
    expect(Object.values(session.values)).toEqual([expect.objectContaining({ apiKey: "secret" })]);
    expect(await getAiSettings()).toEqual({ enabled: true, provider: "custom", endpoint: "https://api.example.com/v1", model: "model", apiKeyStorage: "session", hasApiKey: true });

    await saveAiSettings({ enabled: false, provider: "custom", endpoint: "https://api.example.com/v1", model: "model", apiKeyStorage: "local" });
    expect(session.values).toEqual({});
    expect(local.values["wanderland.ai.apiKey"]).toMatchObject({ apiKey: "secret" });
    expect(await getAiSettings()).toMatchObject({ enabled: false, apiKeyStorage: "local", hasApiKey: true });
  });

  it.each(["gemini", "qwen", "moonshot", "openrouter"] as const)("round trips %s settings and preserves a custom model", async (provider) => {
    const local = storageArea();
    const session = storageArea();
    vi.stubGlobal("browser", { storage: { local, session } });
    const preset = aiProviderPresets[provider];
    await saveAiSettings({ enabled: true, provider, endpoint: preset.endpoint, model: "my-custom-model", apiKeyStorage: "session", apiKey: "test-secret" });
    expect(await getAiSettings()).toMatchObject({ provider, endpoint: preset.endpoint, model: "my-custom-model", hasApiKey: true });
    await saveAiSettings({ enabled: false, provider: "custom", endpoint: "https://example.com/v1", model: "other", apiKeyStorage: "session" });
    expect((await getAiSettings()).hasApiKey).toBe(false);
  });

  it("recognizes existing DeepSeek endpoints when migrating settings", async () => {
    const local = storageArea();
    const session = storageArea();
    local.values["wanderland.ai.settings"] = { enabled: true, endpoint: "https://api.deepseek.com", model: "deepseek-v4-flash", apiKeyStorage: "session" };
    vi.stubGlobal("browser", { storage: { local, session } });

    expect(await getAiSettings()).toMatchObject({ provider: "deepseek", endpoint: "https://api.deepseek.com", model: "deepseek-v4-flash" });
  });

  it("does not reuse an API key after switching providers", async () => {
    const local = storageArea();
    const session = storageArea();
    vi.stubGlobal("browser", { storage: { local, session } });
    await saveAiSettings({ enabled: true, provider: "openai", endpoint: "https://api.openai.com/v1", model: "gpt-4.1-mini", apiKeyStorage: "session", apiKey: "openai-secret" });

    const view = await saveAiSettings({ enabled: false, provider: "deepseek", endpoint: "https://api.deepseek.com", model: "deepseek-v4-flash", apiKeyStorage: "session" });

    expect(view.hasApiKey).toBe(false);
    expect(session.values).toEqual({});
  });

  it("preserves the saved settings and key when an enabled endpoint changes origin without a new key", async () => {
    const local = storageArea();
    const session = storageArea();
    vi.stubGlobal("browser", { storage: { local, session } });
    const settings = { enabled: true, provider: "custom" as const, endpoint: "https://api.example.com/v1", model: "model", apiKeyStorage: "session" as const };
    await saveAiSettings({ ...settings, apiKey: "test-secret" });
    await expect(saveAiSettings({ ...settings, endpoint: "https://api.example.net/v1" })).rejects.toThrow("请填写 API Key。");
    expect(await getAiSettings()).toEqual({ ...settings, hasApiKey: true });
    expect(Object.values(session.values)).toEqual([expect.objectContaining({ apiKey: "test-secret" })]);

    await expect(saveAiSettings({ ...settings, endpoint: "https://api.example.com/v2" })).resolves.toMatchObject({ hasApiKey: true });
  });

  it("never pairs old settings with a new origin's session key during a concurrent read", async () => {
    const local = storageArea();
    const session = storageArea();
    vi.stubGlobal("browser", { storage: { local, session } });
    const settings = { enabled: true, provider: "custom" as const, endpoint: "https://api.example.com/v1", model: "model", apiKeyStorage: "session" as const };
    const next = { ...settings, endpoint: "https://api.example.net/v1" };
    await saveAiSettings({ ...settings, apiKey: "old-key" });
    const get = session.get;
    for (const read of [() => getAiTestCredentials(settings), getAiCredentials]) {
      await saveAiSettings({ ...settings, apiKey: "old-key" });
      const entered = Promise.withResolvers<void>();
      const resume = Promise.withResolvers<void>();
      vi.spyOn(session, "get").mockImplementationOnce(async (key) => {
        entered.resolve();
        await resume.promise;
        return get(key);
      });
      const pending = read().catch((error: Error) => error.message);
      await entered.promise;
      await saveAiSettings({ ...next, apiKey: "new-key" });
      resume.resolve();
      const expected = { settings: next, apiKey: "new-key" };
      expect(await pending).toEqual(read === getAiCredentials ? expected : "请先填写 API Key。");
      expect(await getAiCredentials()).toEqual(expected);
    }
  });

  it("retries until the session key matches after two consecutive saves", async () => {
    const local = storageArea();
    const session = storageArea();
    vi.stubGlobal("browser", { storage: { local, session } });
    const settings = { enabled: true, provider: "custom" as const, endpoint: "https://api.example.com/v1", model: "first", apiKeyStorage: "session" as const };
    await saveAiSettings({ ...settings, apiKey: "first-key" });
    const get = session.get;
    const delayedReads = vi.spyOn(session, "get");
    const delayNextRead = () => {
      const entered = Promise.withResolvers<void>();
      const resume = Promise.withResolvers<void>();
      delayedReads.mockImplementationOnce(async (keys) => {
        entered.resolve();
        await resume.promise;
        return get(keys);
      });
      return { entered: entered.promise, resume: resume.resolve };
    };
    const first = delayNextRead();
    const reading = getAiCredentials();
    await first.entered;
    await saveAiSettings({ ...settings, model: "second", apiKey: "second-key" });
    const second = delayNextRead();
    first.resume();
    await second.entered;
    const latest = { ...settings, model: "third" };
    await saveAiSettings({ ...latest, apiKey: "third-key" });
    second.resume();
    await expect(reading).resolves.toEqual({ settings: latest, apiKey: "third-key" });
  });

  it.each(["local", "session"] as const)("retains and scopes a legacy %s key on the next save", async (apiKeyStorage) => {
    const local = storageArea();
    const session = storageArea();
    vi.stubGlobal("browser", { storage: { local, session } });
    const settings = { enabled: true, provider: "custom" as const, endpoint: "https://api.example.com/v1", model: "model", apiKeyStorage };
    local.values["wanderland.ai.settings"] = settings;
    const [area, key] = apiKeyStorage === "local" ? [local, "wanderland.ai.apiKey"] : [session, "wanderland.ai.sessionApiKey"];
    area.values[key] = "legacy-key";
    expect(await getAiCredentials()).toEqual({ settings, apiKey: "legacy-key" });
    await saveAiSettings(settings);
    expect(Object.values(area.values)).toContainEqual({ provider: settings.provider, endpoint: settings.endpoint, apiKey: "legacy-key" });
    if (apiKeyStorage === "session") expect(area.values[key]).toBeUndefined();
  });

  it("keeps the old model and session key paired while a same-origin rotation is pending or fails", async () => {
    const local = storageArea();
    const session = storageArea();
    vi.stubGlobal("browser", { storage: { local, session } });
    const settings = { enabled: true, provider: "custom" as const, endpoint: "https://api.example.com/v1", model: "old-model", apiKeyStorage: "session" as const };
    await saveAiSettings({ ...settings, apiKey: "old-key" });
    const entered = Promise.withResolvers<void>();
    const fail = Promise.withResolvers<void>();
    vi.spyOn(local, "set").mockImplementationOnce(async () => {
      entered.resolve();
      await fail.promise;
      throw new Error("Storage failed");
    });
    const rotation = saveAiSettings({ ...settings, model: "new-model", apiKey: "new-key" });
    const assertion = expect(rotation).rejects.toThrow("Storage failed");
    await entered.promise;
    try {
      expect(await getAiCredentials()).toEqual({ settings, apiKey: "old-key" });
    } finally {
      fail.resolve();
      await assertion;
    }
    expect(await getAiCredentials()).toEqual({ settings, apiKey: "old-key" });
    expect(Object.values(session.values)).toEqual([expect.objectContaining({ apiKey: "old-key" })]);
  });

  it("resolves test credentials without persisting an unsaved key", async () => {
    const local = storageArea();
    const session = storageArea();
    vi.stubGlobal("browser", { storage: { local, session } });

    const result = await getAiTestCredentials({ enabled: true, provider: "custom", endpoint: "https://api.example.com/v1", model: "model", apiKeyStorage: "session", apiKey: "temporary-secret" });

    expect(result.apiKey).toBe("temporary-secret");
    expect(Object.values(local.values)).not.toContain("temporary-secret");
    expect(Object.values(session.values)).not.toContain("temporary-secret");
  });

  it("rejects an empty custom model before saving or testing", async () => {
    const settings = { enabled: false, provider: "gemini" as const, endpoint: aiProviderPresets.gemini.endpoint, model: "  ", apiKeyStorage: "session" as const };
    await expect(saveAiSettings(settings)).rejects.toThrow("请填写模型 ID");
    await expect(getAiTestCredentials(settings)).rejects.toThrow("请填写模型 ID");
  });

  it("rejects insecure or credential-bearing endpoints before storing a key", async () => {
    const local = storageArea();
    const session = storageArea();
    vi.stubGlobal("browser", { storage: { local, session } });

    await expect(saveAiSettings({ enabled: true, provider: "custom", endpoint: "http://api.example.com", model: "model", apiKeyStorage: "session", apiKey: "secret" })).rejects.toThrow("https://");
    await expect(saveAiSettings({ enabled: true, provider: "custom", endpoint: "https://secret@api.example.com", model: "model", apiKeyStorage: "session", apiKey: "secret" })).rejects.toThrow("不能包含");
    expect(Object.values(local.values)).not.toContain("secret");
    expect(Object.values(session.values)).not.toContain("secret");
  });

  it("restricts both credential storage areas to trusted extension contexts", async () => {
    const local = storageArea();
    const session = storageArea();
    vi.stubGlobal("browser", { storage: { local, session } });

    await hardenAiCredentialStorage();

    expect(local.setAccessLevel).toHaveBeenCalledWith({ accessLevel: "TRUSTED_CONTEXTS" });
    expect(session.setAccessLevel).toHaveBeenCalledWith({ accessLevel: "TRUSTED_CONTEXTS" });
  });
});
