import { describe, expect, it } from "vitest";
import { aiProviderPresets, aiRequestOptions, inferProvider } from "./presets";

describe("AI provider presets", () => {
  it("uses the current official DeepSeek OpenAI-compatible endpoint and model", () => {
    expect(aiProviderPresets.deepseek).toMatchObject({
      endpoint: "https://api.deepseek.com",
      model: "deepseek-flash",
    });
    expect(inferProvider("https://api.deepseek.com/v1")).toBe("deepseek");
  });
  it("recognizes regional endpoints without matching unrelated hosts", () => {
    expect(inferProvider("https://api.moonshot.ai/v1")).toBe("moonshot");
    expect(inferProvider("https://workspace123.cn-beijing.maas.aliyuncs.com/compatible-mode/v1")).toBe("qwen");
    expect(inferProvider("https://dashscope-intl.aliyuncs.com/compatible-mode/v1")).toBe("qwen");
    expect(inferProvider("https://api.moonshot.cn.example.com/v1")).toBe("custom");
  });

  it("reserves reasoning tokens for Gemini through OpenRouter", () => {
    expect(aiRequestOptions({ provider: "openrouter", model: "google/gemini-3.8-flash" })).toMatchObject({ extraBody: { reasoning: { effort: "low" } }, maxTokens: 4096, omitTemperature: true });
  });

});
