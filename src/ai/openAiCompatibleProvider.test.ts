import { afterEach, describe, expect, it, vi } from "vitest";
import { aiProviderPresets, aiRequestOptions } from "./presets";
import { AiProviderError, OpenAiCompatibleProvider } from "./openAiCompatibleProvider";

const input = {
  url: "https://example.com/article",
  kind: "article" as const,
  title: "Article",
  currentDescription: "",
  pageExcerpt: "Excerpt",
  pageText: "Text",
  existingTags: [{ name: "设计", aliases: ["design"] }],
};

afterEach(() => vi.unstubAllGlobals());

describe("OpenAiCompatibleProvider", () => {
  it("tests connectivity with a minimal request without requiring structured output", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: "OK" } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new OpenAiCompatibleProvider({ endpoint: "https://api.example.com/v1", model: "test", apiKey: "secret" });

    await expect(provider.testConnection()).resolves.toBeUndefined();
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string);
    expect(body).toMatchObject({ model: "test", max_tokens: 1, messages: [{ role: "user", content: "Reply OK." }] });
    expect(body).not.toHaveProperty("response_format");
  });

  it.each(["gemini", "qwen", "moonshot", "openrouter"] as const)("uses %s parameters for both testing and analysis", async (id) => {
    const preset = aiProviderPresets[id];
    const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ description: "A design article", tags: ["Design", "UI", "Web"] }) } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new OpenAiCompatibleProvider({ endpoint: preset.endpoint, model: preset.model, apiKey: "test-secret", ...aiRequestOptions({ provider: id, model: preset.model }) });
    await provider.testConnection();
    await expect(provider.analyze(input)).resolves.toMatchObject({ tags: ["Design", "UI", "Web"] });
    const bodies = fetchMock.mock.calls.map((call) => JSON.parse(call[1].body as string));
    expect(fetchMock.mock.calls.every((call) => call[0] === `${preset.endpoint}/chat/completions`)).toBe(true);
    for (const body of bodies) {
      expect(body.model).toBe(preset.model);
      if (id === "qwen") expect(body.enable_thinking).toBe(false);
      if (id === "moonshot" || id === "gemini") {
        expect(body).not.toHaveProperty("temperature");
        expect(body.reasoning_effort).toBe(id === "moonshot" ? "low" : "minimal");
      }
    }
    expect(bodies[1]).toMatchObject({ response_format: { type: "json_object" } });
    if (id === "moonshot") expect(bodies[1].max_tokens).toBeGreaterThanOrEqual(16000);
  });

  it.each(["gpt-5", "gpt-5.4", "gpt-6.1-terra", "o3"])("adapts modern OpenAI chat parameters for %s", async (model) => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ description: "A design article", tags: ["Design", "UI", "Web"] }) } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new OpenAiCompatibleProvider({ endpoint: "https://api.openai.com/v1", model, apiKey: "test-secret", ...aiRequestOptions({ provider: "openai", model }) });
    await provider.testConnection();
    await provider.analyze(input);
    const bodies = fetchMock.mock.calls.map((call) => JSON.parse(call[1].body as string));
    for (const body of bodies) {
      expect(body).not.toHaveProperty("max_tokens");
      expect(body).not.toHaveProperty("temperature");
      expect(body.max_completion_tokens).toBeGreaterThan(0);
    }
    expect(bodies[1].max_completion_tokens).toBeGreaterThanOrEqual(16000);
  });

  it("accepts a valid structured response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: "{\"description\":\"一篇设计文章\",\"tags\":[\"设计\",\"排版\",\"前端\"]}" } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new OpenAiCompatibleProvider({ endpoint: "https://api.example.com/v1", model: "test", apiKey: "secret", extraBody: { thinking: { type: "disabled" } } });

    await expect(provider.analyze(input)).resolves.toEqual({ description: "一篇设计文章", tags: ["设计", "排版", "前端"] });
    expect(fetch).toHaveBeenCalledWith("https://api.example.com/v1/chat/completions", expect.objectContaining({ method: "POST" }));
    expect(fetchMock.mock.calls[0]![1]).toMatchObject({ redirect: "error" });
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string);
    expect(body).toMatchObject({ thinking: { type: "disabled" }, max_tokens: 600 });
    expect(body.messages[0].content).toContain("description 必须使用自然、简洁的简体中文");
  });

  it("uses the selected app language for generated descriptions and tags", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: "{\"description\":\"A design article\",\"tags\":[\"Design\",\"Typography\",\"Frontend\"]}" } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new OpenAiCompatibleProvider({ endpoint: "https://api.example.com/v1", model: "test", apiKey: "secret", outputLanguage: "en-US" });

    await provider.analyze(input);

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string);
    expect(body.messages[0].content).toContain("description must use concise, natural English");
  });

  it("rejects invalid JSON and duplicate tags as non-retryable output errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: "{\"description\":\"x\",\"tags\":[\"设计\",\"设计\",\"前端\"]}" } }],
    }), { status: 200 })));
    const provider = new OpenAiCompatibleProvider({ endpoint: "https://api.example.com/v1", model: "test", apiKey: "secret" });

    await expect(provider.analyze(input)).rejects.toMatchObject<Partial<AiProviderError>>({ retryable: false });
  });

  it("marks provider throttling as retryable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 })));
    const provider = new OpenAiCompatibleProvider({ endpoint: "https://api.example.com/v1", model: "test", apiKey: "secret" });

    await expect(provider.analyze(input)).rejects.toMatchObject<Partial<AiProviderError>>({ retryable: true });
  });

  it("redacts the API key if a provider echoes it in an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("invalid key: real-secret", { status: 401 })));
    const provider = new OpenAiCompatibleProvider({ endpoint: "https://api.example.com/v1", model: "test", apiKey: "real-secret" });

    await expect(provider.analyze(input)).rejects.toMatchObject({ message: "Provider 返回 401：invalid key: [REDACTED]" });
  });

  it("redacts the API key from connection-test errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("invalid key: real-secret", { status: 401 })));
    const provider = new OpenAiCompatibleProvider({ endpoint: "https://api.example.com/v1", model: "test", apiKey: "real-secret" });

    await expect(provider.testConnection()).rejects.toMatchObject({ message: "Provider 返回 401：invalid key: [REDACTED]" });
  });

  it("aborts timed out requests without accepting partial output", async () => {
    vi.stubGlobal("fetch", vi.fn((_url, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));
    const provider = new OpenAiCompatibleProvider({ endpoint: "https://api.example.com/v1", model: "test", apiKey: "secret", timeoutMs: 5 });

    await expect(provider.analyze(input)).rejects.toMatchObject<Partial<AiProviderError>>({ retryable: true, message: "AI 请求超时" });
  });
});
