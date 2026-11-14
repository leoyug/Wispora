import { RiRefreshLine } from "@remixicon/react";
import { useEffect, useRef, useState } from "react";
import { requestAiModels } from "@/src/ai/client";
import { aiModelLabel, aiProviderPresets } from "@/src/ai/presets";
import type { AiModelOption, AiProviderId, AiSettings } from "@/src/ai/types";
import { Button } from "@/src/components/ui/Button";
import { Field } from "@/src/components/ui/Field";
import { SelectMenu } from "@/src/components/ui/SelectMenu";
import { t, tf } from "@/src/i18n/ui";

const manualSelection = "manual";
const modelSelection = (id: string) => `model:${id}`;

interface AiModelSelectProps {
  provider: AiProviderId;
  value: string;
  onChange: (model: string) => void;
  settings?: AiSettings;
  apiKey?: string;
}

export function AiModelSelect({ provider, value, onChange, settings, apiKey }: AiModelSelectProps) {
  const [manual, setManual] = useState(false);
  const [catalog, setCatalog] = useState<AiModelOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const endpoint = settings?.endpoint;
  useEffect(() => {
    requestId.current += 1;
    setCatalog(null); setLoading(false); setError("");
    return () => { requestId.current += 1; };
  }, [provider, endpoint, apiKey]);

  const models: readonly AiModelOption[] = catalog ?? (provider === "custom" ? [] : aiProviderPresets[provider].models.map((id) => ({ id })));
  // Keep a saved/typed model visible even when it is absent from a refreshed catalog.
  const options = catalog && value && !models.some((model) => model.id === value) ? [{ id: value }, ...models] : models;
  const isCustom = manual || !options.some((model) => model.id === value);
  const selectModel = (selection: string) => {
    setManual(selection === manualSelection);
    const model = options.find(({ id }) => modelSelection(id) === selection);
    if (model) onChange(model.id);
  };
  const refresh = async () => {
    if (!settings) return;
    const id = ++requestId.current;
    setLoading(true); setError("");
    try {
      const result = await requestAiModels({ ...settings, apiKey: apiKey?.trim() || undefined });
      if (requestId.current === id) setCatalog(result);
    } catch (reason) {
      if (requestId.current === id) setError(reason instanceof Error ? t(reason.message) : t("获取模型失败，请重试或手动填写模型 ID。"));
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  };

  return <div className="ai-model-control" aria-busy={loading}>
    {options.length > 0 ? <SelectMenu label={t("模型选择")} value={isCustom ? manualSelection : modelSelection(value)} options={[...options.map((model) => ({ value: modelSelection(model.id), label: model.name && model.name !== model.id ? `${model.name}（${model.id}）` : model.name ?? aiModelLabel(provider, model.id) })), { value: manualSelection, label: t("自定义模型") }]} onChange={selectModel} /> : null}
    {isCustom ? <Field label={t("模型 ID")} value={value} onChange={onChange} placeholder={t("填写提供商的模型 ID")} /> : null}
    {settings ? <>
      <Button variant="secondary" size="sm" isDisabled={loading} onPress={() => void refresh()}><RiRefreshLine size={15} aria-hidden="true" />{loading ? t("正在获取…") : catalog ? t("刷新模型") : t("获取模型")}</Button>
      <small className="ai-model-hint" role="status">{catalog ? tf("已获取 {count} 个模型；能否用于整理请测试连接。", { count: catalog.length }) : t("当前为内置预设。填写 API Key 后可获取提供商的模型列表。")}</small>
      {error ? <small className="ai-model-error" role="alert">{error}</small> : null}
    </> : null}
  </div>;
}
