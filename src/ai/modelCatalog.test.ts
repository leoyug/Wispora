import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchModelCatalog, loadConfiguredModels, modelCatalogUrl } from "./modelCatalog";
import type { AiSettings } from "./types";

const settings: AiSettings = { enabled: false, provider: "openai", endpoint: "https://api.openai.com/v1", model: "", apiKeyStorage: "session" };
function response(data: unknown) { return new Response(JSON.stringify(data), { status: 200 }); }
function browserMock(saved = settings) {
  const values: Record<string, unknown> = { "wanderland.ai.settings": saved };
  const session: Record<string, unknown> = { "wanderland.ai.sessionApiKey": "saved-secret" };
  const area = (data: Record<string, unknown>) => ({ get: vi.fn(async () => data), set: vi.fn(), remove: vi.fn() });
  const browser = { storage: { local: area(values), session: area(session) }, permissions: { contains: vi.fn().mockResolvedValue(true), remove: vi.fn().mockResolvedValue(true) } };
  vi.stubGlobal("browser", browser);
  return browser;
}
afterEach(() => vi.unstubAllGlobals());

describe("model catalog", () => {
  it("normalizes base and full completion URLs without leaking query parameters", () => {
    expect(modelCatalogUrl("https://api.openai.com/v1/")).toBe("https://api.openai.com/v1/models");
    expect(modelCatalogUrl("https://example.com/v1/chat/completions?unused=1#fragment")).toBe("https://example.com/v1/models");
    expect(modelCatalogUrl("https://generativelanguage.googleapis.com/v1beta/openai")).toBe("https://generativelanguage.googleapis.com/v1beta/openai/models");
  });
  it("fetches and deduplicates newly released models, newest first, without a generation request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ data: [{ id: "gpt-4.1-mini", created: 1 }, { id: "gpt-6.1-terra", created: 3 }, { id: "gpt-6.1-terra", created: 3 }, { id: "gpt-5.4", created: 2 }, { id: "" }, null] }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchModelCatalog(settings.endpoint, "secret")).toEqual([{ id: "gpt-6.1-terra" }, { id: "gpt-5.4" }, { id: "gpt-4.1-mini" }]);
    expect(fetchMock).toHaveBeenCalledWith(`${settings.endpoint}/models`, expect.objectContaining({ headers: { Authorization: "Bearer secret" }, redirect: "error" }));
    expect(fetchMock.mock.calls[0]![1]).not.toHaveProperty("body");
  });
  it("preserves provider display names, including updated versions behind a stable ID", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ data: [
      { id: "deepseek-flash", name: "DeepSeek-V4.1-Flash-1017" },
      { id: "deepseek-flash" },
      { id: "new-model", name: "  Provider New Model  " },
      { id: "unnamed-model", name: " " },
    ] })));
    const models = await fetchModelCatalog(settings.endpoint, "secret");
    expect(models).toEqual(expect.arrayContaining([
      { id: "deepseek-flash", name: "DeepSeek-V4.1-Flash-1017" },
      { id: "new-model", name: "Provider New Model" },
      { id: "unnamed-model" },
    ]));
    expect(models).toHaveLength(3);
  });
  it.each([{ data: [] }, { models: [{ name: "some-model" }] }, null])("rejects empty or unsupported catalogs: %j", async (body) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(body)));
    await expect(fetchModelCatalog(settings.endpoint, "secret")).rejects.toThrow(/模型/);
  });
  it("redacts keys in provider errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("invalid real-secret", { status: 401 })));
    await expect(fetchModelCatalog(settings.endpoint, "real-secret")).rejects.toThrow("获取模型失败（401）：invalid [REDACTED]");
  });
  it("times out a stalled model listing", async () => {
    vi.stubGlobal("fetch", vi.fn((_url, init: RequestInit) => new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))))));
    await expect(fetchModelCatalog(settings.endpoint, "secret", 5)).rejects.toThrow("获取模型超时");
  });
  it("uses an unsaved key and an empty model without persisting either, then revokes temporary permission", async () => {
    const browser = browserMock();
    const fetchMock = vi.fn().mockResolvedValue(response({ data: [{ id: "new-model" }] }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await loadConfiguredModels({ ...settings, apiKey: "temporary-secret" })).toEqual([{ id: "new-model" }]);
    expect(fetchMock.mock.calls[0]![1].headers.Authorization).toBe("Bearer temporary-secret");
    expect(browser.storage.local.set).not.toHaveBeenCalled();
    expect(browser.storage.session.set).not.toHaveBeenCalled();
    expect(browser.permissions.remove).toHaveBeenCalledWith({ origins: ["https://api.openai.com/*"] });
  });
  it("preserves the active saved provider's grant and uses its saved key", async () => {
    const browser = browserMock({ ...settings, enabled: true, model: "saved-model" });
    const fetchMock = vi.fn().mockResolvedValue(response({ data: [{ id: "new-model" }] }));
    vi.stubGlobal("fetch", fetchMock);
    await loadConfiguredModels(settings);
    expect(fetchMock.mock.calls[0]![1].headers.Authorization).toBe("Bearer saved-secret");
    expect(browser.permissions.remove).not.toHaveBeenCalled();
  });
  it("revokes temporary permission on HTTP failure", async () => {
    const browser = browserMock();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not supported", { status: 404 })));
    await expect(loadConfiguredModels(settings)).rejects.toThrow("404");
    expect(browser.permissions.remove).toHaveBeenCalled();
  });
  it("does not send a saved key to a changed endpoint", async () => {
    const browser = browserMock();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(loadConfiguredModels({ ...settings, endpoint: "https://other.example/v1" })).rejects.toThrow("API Key");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(browser.permissions.remove).toHaveBeenCalledWith({ origins: ["https://other.example/*"] });
  });
  it("does not fetch without a granted domain", async () => {
    const browser = browserMock();
    browser.permissions.contains.mockResolvedValue(false);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(loadConfiguredModels(settings)).rejects.toThrow("允许访问");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
