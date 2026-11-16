import type { AiProviderId, AiSettings } from "./types";

export interface AiProviderPreset {
  id: Exclude<AiProviderId, "custom">;
  label: string;
  endpoint: string;
  model: string;
  models: readonly string[];
}

export const aiProviderPresets: Record<AiProviderPreset["id"], AiProviderPreset> = {
  openai: { id: "openai", label: "OpenAI", endpoint: "https://api.openai.com/v1", model: "gpt-4.1-mini", models: ["gpt-4.1-mini", "gpt-4.1", "gpt-4.1-nano"] },
  deepseek: { id: "deepseek", label: "DeepSeek", endpoint: "https://api.deepseek.com", model: "deepseek-flash", models: ["deepseek-flash", "deepseek-v4-pro", "deepseek-v4-flash"] },
  gemini: { id: "gemini", label: "Google Gemini", endpoint: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-3.8-flash", models: ["gemini-3.8-flash", "gemini-3.1-flash-lite"] },
  qwen: { id: "qwen", label: "通义千问（Qwen）", endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen3.7-plus", models: ["qwen3.7-plus", "qwen3.8-flash", "qwen3.8-max"] },
  moonshot: { id: "moonshot", label: "Moonshot（Kimi）", endpoint: "https://api.moonshot.cn/v1", model: "kimi-k3.1-pro", models: ["kimi-k3.1-pro", "kimi-k3.1-pro-highspeed", "kimi-k3"] },
  openrouter: { id: "openrouter", label: "OpenRouter", endpoint: "https://openrouter.ai/api/v1", model: "openai/gpt-4.1-mini", models: ["openai/gpt-4.1-mini", "google/gemini-3.8-flash"] },
};

/** Friendly names are display-only; requests and saved settings retain the official ID. */
export function aiModelLabel(provider: AiProviderId, model: string) {
  if (provider === "deepseek" && model === "deepseek-flash") return "DeepSeek V4.1 Flash（deepseek-flash）";
  return model;
}

export const aiProviderOptions: Array<{ value: AiProviderId; label: string }> = [
  ...Object.values(aiProviderPresets).map(({ id, label }) => ({ value: id, label })),
  { value: "custom", label: "自定义服务" },
];

export function isAiProviderId(value: unknown): value is AiProviderId {
  return value === "custom" || (typeof value === "string" && Object.hasOwn(aiProviderPresets, value));
}

export function inferProvider(endpoint: string): AiProviderId {
  try {
    const hostname = new URL(endpoint).hostname;
    if (hostname === "api.moonshot.ai") return "moonshot";
    if (hostname === "dashscope-intl.aliyuncs.com" || /^[\w-]+\.(?:cn-beijing|us-east-1|ap-southeast-1|ap-northeast-1)\.maas\.aliyuncs\.com$/.test(hostname)) return "qwen";
    return Object.values(aiProviderPresets).find((preset) => new URL(preset.endpoint).hostname === hostname)?.id ?? "custom";
  } catch {
    return "custom";
  }
}

/** Keep connection tests and queued analysis on the same provider parameters. */
export function aiRequestOptions({ provider, model }: Pick<AiSettings, "provider" | "model">) {
  if (provider === "openai" && /^(?:gpt-[5-9](?:[.\-]|$)|o[1-9](?:-|$))/.test(model)) return { maxTokens: 16384, testMaxTokens: 128, tokenParameter: "max_completion_tokens" as const, omitTemperature: true, timeoutMs: 60_000 };
  if (provider === "deepseek") return { extraBody: { thinking: { type: "disabled" } } };
  if (provider === "qwen") return { extraBody: { enable_thinking: false } };
  if (provider === "moonshot" && /^kimi-k3/.test(model)) return { extraBody: { reasoning_effort: "low" }, maxTokens: 16384, testMaxTokens: 128, omitTemperature: true, timeoutMs: 60_000 };
  if (provider === "openrouter" && model.startsWith("google/gemini-")) return { extraBody: { reasoning: { effort: "low" } }, maxTokens: 4096, testMaxTokens: 128, omitTemperature: true };
  if (provider === "gemini") return { extraBody: { reasoning_effort: "minimal" }, maxTokens: 4096, testMaxTokens: 128, omitTemperature: true };
  return {};
}
