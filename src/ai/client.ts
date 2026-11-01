import { endpointPermissionPattern } from "./config";
import type { AiModelOption, AiSettings } from "./types";
import type { ExtensionRequest } from "@/src/capture/types";

/** UI entry point: permission requests stay directly inside the user's click gesture. */
export async function requestAiModels(settings: AiSettings & { apiKey?: string }): Promise<AiModelOption[]> {
  if (typeof browser === "undefined" || !browser.runtime?.sendMessage) throw new Error("AI 设置需要在已加载的浏览器扩展页面中使用。");
  const granted = await browser.permissions.request({ origins: [endpointPermissionPattern(settings.endpoint)] });
  if (!granted) throw new Error("需要允许访问当前 Provider 域名，才能获取模型。");
  return browser.runtime.sendMessage({ type: "ai:models:list", settings } satisfies ExtensionRequest) as Promise<AiModelOption[]>;
}
