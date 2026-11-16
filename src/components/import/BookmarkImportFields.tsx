import { Field } from "@/src/components/ui/Field";
import { Switch } from "@/src/components/ui/Switch";
import { SettingsCard, SettingsSectionHeading } from "@/src/components/settings/SettingsPrimitives";
import { t } from "@/src/i18n/ui";

export function BookmarkImportFields({ value, onChange, enrichMetadata, onEnrichChange, variant = "dialog" }: { value: string; onChange: (value: string) => void; enrichMetadata: boolean; onEnrichChange: (value: boolean) => void; variant?: "settings" | "dialog" }) {
  const input = <Field className="batch-url-field" label={t("书签 HTML 内容")} value={value} onChange={onChange} placeholder={t("粘贴浏览器导出的书签 HTML 内容")} multiline rows={8} autoFocus />;
  const enrich = <Switch className={variant === "settings" ? "settings-option-switch" : undefined} label={t("补全网站信息与封面")} description={t("浏览器将一次确认本批次涉及的网站；只读取标题、描述、favicon 和公开 OG 封面，完成后立即撤销全部访问权限。")} isSelected={enrichMetadata} onChange={onEnrichChange} />;
  if (variant === "settings") return <><section className="settings-form-section"><SettingsSectionHeading title={t("书签内容")} description={t("书签会作为“网站”类型保存，已存在的规范化链接会自动跳过。")} />{input}</section><section className="settings-form-section"><SettingsSectionHeading title={t("补全收藏项信息")} description={t("浏览器将一次确认本批次涉及的网站。")} /><SettingsCard className="settings-option-card">{enrich}</SettingsCard></section></>;
  return <>{input}<p className="form-help">{t("书签会作为“网站”保存，已存在的规范化链接会自动跳过。")}</p>{enrich}</>;
}
