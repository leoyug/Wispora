import { endpointPermissionPattern, getAiCredentials } from "./config";
import { releaseUnusedHostPermissions, withHostPermissionUse } from "./hostPermissions";
import { AiProviderError, OpenAiCompatibleProvider } from "./openAiCompatibleProvider";
import { inspirationRepository } from "@/src/db/repository";
import { getAppLanguage } from "@/src/i18n/language";

import { aiRequestOptions } from "./presets";

let activeRun: Promise<void> | undefined;
let rerunRequested = false;

async function runQueue() {
  const tasks = await inspirationRepository.listRunnableAiTasks();
  for (const task of tasks) {
    const canContinue = await withHostPermissionUse(async () => {
      const credentials = await getAiCredentials();
      if (!credentials || !(await browser.permissions.contains({ origins: [endpointPermissionPattern(credentials.settings.endpoint)] }))) return false;
      if (!(await inspirationRepository.isAiTaskReady(task.itemId))) return true;
      if (!(await inspirationRepository.markAiStarted(task.id))) return true;
      try {
        const provider = new OpenAiCompatibleProvider({
          endpoint: credentials.settings.endpoint,
          model: credentials.settings.model,
          apiKey: credentials.apiKey,
          outputLanguage: await getAppLanguage(),
          ...aiRequestOptions(credentials.settings),
        });
        const input = await inspirationRepository.getAiAnalysisInput(task.itemId);
        if (input) {
          const analysis = await provider.analyze(input);
          await inspirationRepository.completeAiTask(task.id, analysis);
        }
      } catch (error) {
        const retryable = error instanceof AiProviderError ? error.retryable : true;
        const reason = error instanceof Error ? error.message : "AI 处理失败";
        await inspirationRepository.failAiTask(task.id, reason, retryable);
      }
      return true;
    }).finally(() => releaseUnusedHostPermissions().catch(() => undefined));
    if (!canContinue) break;
  }
}

export function processAiQueue() {
  if (activeRun) {
    rerunRequested = true;
    return activeRun;
  }
  activeRun = (async () => {
    do {
      rerunRequested = false;
      await runQueue();
    } while (rerunRequested);
  })().finally(() => { activeRun = undefined; });
  return activeRun;
}
