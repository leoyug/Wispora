import { RiDeleteBinLine, RiEditLine } from "@remixicon/react";
import { useRef, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { CompactSearchField } from "@/src/components/ui/SearchField";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { ContextMenu } from "@/src/components/ui/ContextMenu";
import { Dialog, FormDialogHeader, FormDialogFooter, Modal, ModalOverlay } from "@/src/components/ui/Modal";
import { Menu, MenuContent, MenuItem } from "@/src/components/ui/Menu";
import { TagInput } from "@/src/components/ui/TagInput";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { ScrollArea } from "@/src/components/ui/ScrollArea";
import { Field } from "@/src/components/ui/Field";
import { FavoriteButton } from "@/src/components/inspiration/FavoriteButton";
import { SiteIcon } from "@/src/components/inspiration/SiteIcon";
import { TagSummary } from "@/src/components/inspiration/TagSummary";
import { CoverArt } from "@/src/components/inspiration/CoverArt";
import { SettingsCard, SettingsHeader, SettingsRow, SettingsSectionHeading } from "@/src/components/settings/SettingsPrimitives";
import { BookmarkImportFields } from "@/src/components/import/BookmarkImportFields";
import { t } from "@/src/i18n/ui";

export function ComponentPreview() {
  const [tags, setTags] = useState<string[]>(["React"]);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<"form" | "confirm" | null>(null);
  const [context, setContext] = useState<{ x: number; y: number } | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [html, setHtml] = useState("");
  const [enrich, setEnrich] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const contextTrigger = useRef<HTMLButtonElement>(null);
  const tagsOptions = ["React", "Design", "Motion", "Type"].map((name) => ({ id: name, name, normalizedName: name.toLowerCase(), aliases: [], usageCount: 1, createdAt: 0, updatedAt: 0 }));
  const closeContext = () => { setContext(null); requestAnimationFrame(() => contextTrigger.current?.focus()); };
  return <div className="component-stack">
    <h3>{t("标签输入与普通搜索")}</h3>
    <TagInput label={t("标签")} tags={tags} options={tagsOptions} onChange={setTags} />
    <CompactSearchField aria-label={t("搜索示例")} placeholder={t("搜索标签")} value={query} onChange={setQuery} />
    <h3>{t("菜单、弹窗与提示")}</h3>
    <div className="component-row">
      <Menu><Button>{t("打开菜单")}</Button><MenuContent placement="bottom start" aria-label={t("菜单示例")}>
        <MenuItem id="edit" textValue={t("编辑名称")} onAction={() => setFeedback("编辑名称")}><RiEditLine size={16} /><span>{t("编辑名称")}</span></MenuItem>
        <MenuItem id="disabled" textValue={t("禁用选项")} isDisabled><RiEditLine size={16} /><span>{t("禁用选项")}</span></MenuItem>
        <MenuItem id="delete" textValue={t("删除")} danger separatorBefore onAction={() => setDialog("confirm")}><RiDeleteBinLine size={16} /><span>{t("删除")}</span></MenuItem>
      </MenuContent></Menu>
      <Button ref={contextTrigger} onPress={() => { const rect = contextTrigger.current!.getBoundingClientRect(); setContext({ x: rect.left, y: rect.bottom }); }} onContextMenu={(event) => { event.preventDefault(); setContext({ x: event.clientX, y: event.clientY }); }}>{t("打开右键菜单")}</Button>
      <Button onPress={() => setDialog("form")}>{t("打开表单弹窗")}</Button>
      <Button onPress={() => setDialog("confirm")}>{t("打开确认弹窗")}</Button>
      <Tooltip content={t("支持悬停与键盘聚焦")}><Button>{t("提示气泡")}</Button></Tooltip>
    </div>
    <p role="status">{t(feedback)}</p>
    {context ? <ContextMenu label={t("菜单示例")} position={context} onClose={closeContext} actions={[{ id: "edit", label: t("编辑名称"), icon: <RiEditLine size={16} />, onAction: () => setFeedback("编辑名称") }, { id: "disabled", label: t("禁用选项"), icon: <RiEditLine size={16} />, disabled: true, onAction: () => undefined }, { id: "delete", label: t("删除"), icon: <RiDeleteBinLine size={16} />, separatorBefore: true, danger: true, onAction: () => setDialog("confirm") }]} /> : null}
    <ConfirmDialog isOpen={dialog === "confirm"} title={t("删除示例？")} description={t("此操作只演示组件，不会修改收藏库。")} onClose={() => setDialog(null)} onConfirm={() => setFeedback("操作已完成")} />
    <ModalOverlay className="detail-overlay" isOpen={dialog === "form"} isDismissable onOpenChange={(open) => !open && setDialog(null)}><Modal className="form-modal"><Dialog className="form-dialog">{({ close }) => <form onSubmit={(event) => { event.preventDefault(); setFeedback("操作已完成"); close(); }}><FormDialogHeader title={t("表单示例")} description={t("固定标题与操作栏，中间内容可滚动。")} icon={<RiEditLine size={20} />} closeLabel={t("关闭")} onClose={close} /><div className="form-dialog-body"><Field label={t("名称")} autoFocus /><Field label={t("描述（可选）")} multiline /><Field label={t("禁用选项")} isDisabled value="Wispora" /><p className="form-error" role="alert">{t("错误状态")}</p></div><FormDialogFooter onCancel={close} submitLabel={t("保存")} /></form>}</Dialog></Modal></ModalOverlay>
    <h3>{t("图标、封面与标签展开")}</h3>
    <div className="component-row preview-favorite"><FavoriteButton isFavorite={favorite} onToggle={() => setFavorite((value) => !value)} /><SiteIcon item={{ url: "", siteIcon: "/icon/32.png" }} /><SiteIcon item={{ url: "", siteIcon: "/icon/32.png" }} variant="avatar" /><SiteIcon item={{ url: "" }} /></div>
    <TagSummary tags={["React", "Design", "Motion", "Type", "CSS"]} onTagClick={setFeedback} />
    <CoverArt item={{ title: "Wispora", cover: { label: "网站", background: "var(--color-surface-subtle)", foreground: "var(--color-muted)", motif: "type" } }} />
    <h3>{t("横向滚动区域")}</h3><ScrollArea orientation="horizontal"><div className="preview-scroll-items">{tagsOptions.map((tag) => <span key={tag.id}>{tag.name} · Wispora design system</span>)}</div></ScrollArea>
    <SettingsHeader title={t("设置布局示例")} description={t("设置页与简报共用的布局组件。")} />
    <SettingsSectionHeading title={t("模型与连接")} description={t("选择服务并配置请求地址、模型和 API Key。")} />
    <SettingsCard><SettingsRow title={t("名称")} description={t("支持悬停与键盘聚焦")} control={<Field label={t("名称")} defaultValue="Wispora" />} /><SettingsRow title={t("加载状态")} control={<Button isDisabled={pending} onPress={() => setPending(true)}>{pending ? t("正在保存") : t("保存")}</Button>}><Button variant="ghost" onPress={() => setPending(false)}>{t("重置示例")}</Button></SettingsRow></SettingsCard>
    <h3>{t("书签导入表单")}</h3><BookmarkImportFields value={html} onChange={setHtml} enrichMetadata={enrich} onEnrichChange={setEnrich} />
  </div>;
}
