import { assertSecureAiEndpoint, endpointPermissionPattern, getAiConnectionCredentials } from "./config";
import { withTemporaryAiPermission } from "./hostPermissions";
import type { AiModelOption, AiSettings } from "./types";

export function modelCatalogUrl(endpoint: string) {
  const url = assertSecureAiEndpoint(endpoint);
  // A full completion URL is also accepted by the existing settings form.
  url.pathname = `${url.pathname.replace(/\/chat\/completions\/?$/, "").replace(/\/$/, "")}/models`;
  url.search = "";
  url.hash = "";
  return url.href;
}

export async function fetchModelCatalog(endpoint: string, apiKey: string, timeoutMs = 15_000): Promise<AiModelOption[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(modelCatalogUrl(endpoint), {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      redirect: "error",
    });
    if (!response.ok) {
      const detail = (await response.text()).replaceAll(apiKey, "[REDACTED]").slice(0, 240);
      throw new Error(`获取模型失败（${response.status}）${detail ? `：${detail}` : ""}`);
    }
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || !("data" in body) || !Array.isArray(body.data)) throw new Error("提供商返回的模型列表格式无效，可手动填写模型 ID。");
    const models = new Map<string, { model: AiModelOption; created: number }>();
    for (const entry of body.data) {
      if (!entry || typeof entry !== "object" || typeof entry.id !== "string") continue;
      const id = entry.id.trim();
      if (!id || id.length > 256) continue;
      const name = typeof entry.name === "string" ? entry.name.trim().slice(0, 256) : undefined;
      const previous = models.get(id);
      models.set(id, {
        model: name ? { id, name } : previous?.model ?? { id },
        created: typeof entry.created === "number" && Number.isFinite(entry.created) ? entry.created : previous?.created ?? 0,
      });
    }
    if (!models.size) throw new Error("提供商没有返回模型，可手动填写模型 ID。");
    return [...models.values()].sort((a, b) => b.created - a.created || b.model.id.localeCompare(a.model.id, "en", { numeric: true })).map(({ model }) => model);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("获取模型超时，请重试或手动填写模型 ID。");
    const message = error instanceof Error ? error.message : "获取模型失败，请重试或手动填写模型 ID。";
    throw new Error(apiKey ? message.replaceAll(apiKey, "[REDACTED]") : message);
  } finally {
    clearTimeout(timeout);
  }
}

/** This entry point runs only in the background, behind trusted sender validation. */
export async function loadConfiguredModels(input: AiSettings & { apiKey?: string }): Promise<AiModelOption[]> {
  const origin = endpointPermissionPattern(input.endpoint);
  return withTemporaryAiPermission(origin, async () => {
    if (!(await browser.permissions.contains({ origins: [origin] }))) throw new Error("需要允许访问当前 Provider 域名，才能获取模型。");
    const { settings, apiKey } = await getAiConnectionCredentials(input);
    return await fetchModelCatalog(settings.endpoint, apiKey);
  });
}
