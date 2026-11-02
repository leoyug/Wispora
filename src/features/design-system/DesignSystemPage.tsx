import { RiAddLine, RiArrowLeftLine, RiArrowUpDownLine, RiCheckLine, RiErrorWarningLine, RiPriceTag3Line, RiSettings3Line } from "@remixicon/react";
import { useEffect, useState, type ReactNode } from "react";
import { FloatingAddMenu } from "@/src/components/inspiration/FloatingAddMenu";
import { DigestEditionCard } from "@/src/components/inspiration/DigestEditionCard";
import { buildDigest } from "@/src/domain/digest";
import { DigestReadingRail } from "@/src/features/digest/DigestReadingRail";
import { digestEntryAnchor } from "@/src/features/digest/readingNavigation";
import { InspirationCard } from "@/src/components/inspiration/InspirationCard";
import { BrandLogo } from "@/src/components/brand/BrandLogo";
import { InspirationListItem } from "@/src/components/inspiration/InspirationListItem";
import { LibraryLayoutSelect, type LibraryLayoutMode } from "@/src/components/inspiration/LibraryLayoutSelect";
import { LibraryEmptyState } from "@/src/features/library/LibraryEmptyState";
import { SavedViewReorderList } from "@/src/components/layout/SavedViewReorderList";
import { SidebarIcon } from "@/src/components/layout/SidebarIcon";
import { SidebarNavItem } from "@/src/components/layout/SidebarNavItem";
import { Badge } from "@/src/components/ui/Badge";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/ToggleGroup";
import { Checkbox, CheckboxField, CheckboxGroup } from "@/src/components/ui/Checkbox";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { AiModelSelect } from "@/src/components/ai/AiModelSelect";
import { Field } from "@/src/components/ui/Field";
import { FacetFilter } from "@/src/components/ui/FacetFilter";
import { KeyboardShortcut } from "@/src/components/ui/KeyboardShortcut";
import { RadioGroup } from "@/src/components/ui/RadioGroup";
import { SelectMenu } from "@/src/components/ui/SelectMenu";
import { SelectedTagBar } from "@/src/components/ui/SelectedTagBar";
import { Switch } from "@/src/components/ui/Switch";
import { useToast } from "@/src/components/ui/Toast";
import { inspirationItems } from "@/src/data/demo";
import type { LibrarySavedView } from "@/src/domain/inspiration";
import { SearchPreview } from "./SearchPreview";
import { ComponentPreview } from "./ComponentPreview";
import { FoundationPreview } from "./FoundationPreview";
import { CompactSearchField } from "@/src/components/ui/SearchField";
import { colorTokens } from "./tokenCatalog";
import { t, tf } from "@/src/i18n/ui";
import { setThemePreference } from "@/src/lib/themePreferences";
import "./preview.css";

const digestPreview = buildDigest("weekly", inspirationItems[0]!.createdAt, inspirationItems);

function PreviewSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="preview-section">
      <div className="preview-section-title"><h2>{title}</h2><p>{description}</p></div>
      <div className="preview-canvas">{children}</div>
    </section>
  );
}

export function DesignSystemPage({ onBack }: { onBack: () => void }) {
  const [previewSearch, setPreviewSearch] = useState("");
  const [previewLayout, setPreviewLayout] = useState<LibraryLayoutMode>("cards");
  const [previewChipKeys, setPreviewChipKeys] = useState(new Set<string>(["title"]));
  const [checkedFields, setCheckedFields] = useState<string[]>(["title"]);
  const [isDark, setIsDark] = useState(document.documentElement.dataset.theme === "dark");
  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(document.documentElement.dataset.theme === "dark"));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  const { showToast, showUndoToast, updateToast } = useToast();
  const [previewViews, setPreviewViews] = useState<LibrarySavedView[]>([
    { id: "preview-read-later", name: "稍后阅读", isSystem: true, scope: "article", tagIds: [], tags: [], sortOrder: 0, createdAt: 0, updatedAt: 0 },
    { id: "preview-design", name: "设计灵感", isSystem: false, scope: "website", tagIds: ["design"], tags: ["设计灵感"], sortOrder: 1, createdAt: 0, updatedAt: 0 },
    { id: "preview-dev", name: "开发资源与前端交互动效参考资料", isSystem: false, scope: "all", tagIds: ["components"], tags: ["组件库"], sortOrder: 2, createdAt: 0, updatedAt: 0 },
  ]);
  const [activePreviewView, setActivePreviewView] = useState("preview-design");
  const [previewTags, setPreviewTags] = useState<string[]>(["design"]);
  const [previewModel, setPreviewModel] = useState("gemini-3.8-flash");
  const [previewSort, setPreviewSort] = useState<"newest" | "oldest">("newest");
  const [previewSwitch, setPreviewSwitch] = useState(true);
  const [previewStorage, setPreviewStorage] = useState<"session" | "local">("session");
  const previewLoadingToast = () => {
    const id = showToast(t("正在整理收藏项"), { description: t("AI 正在生成描述与标签。"), isLoading: true });
    window.setTimeout(() => updateToast(id, t("整理完成"), { description: t("描述与标签已更新。"), tone: "success", isLoading: false }), 1200);
  };
  const movePreviewView = (sourceId: string, targetId: string) => {
    setPreviewViews((current) => {
      const system = current.filter((view) => view.isSystem);
      const custom = current.filter((view) => !view.isSystem);
      const sourceIndex = custom.findIndex((view) => view.id === sourceId);
      if (sourceIndex < 0) return current;
      const [moved] = custom.splice(sourceIndex, 1);
      if (!moved) return current;
      const targetIndex = targetId === system[0]?.id ? 0 : custom.findIndex((view) => view.id === targetId);
      custom.splice(targetIndex < 0 ? custom.length : targetIndex, 0, moved);
      return [...system, ...custom];
    });
  };

  return (
    <div className="design-system-page">
      <header className="design-system-header">
        <Button variant="ghost" onPress={onBack}><RiArrowLeftLine size={17} />{t("返回 Wispora")}</Button>
        <div className="design-system-heading"><span>DEV ONLY</span><h1>{t("Wispora · 设计系统")}</h1><p>{t("用于验证 token、组件变体与页面组合的一致性。")}</p></div>
        <div className="design-system-theme"><ToggleGroup label={t("主题")} selectionMode="single" disallowEmptySelection selectedKeys={[isDark ? "dark" : "light"]} onSelectionChange={(keys) => { const next = [...keys][0]; if (next === "light" || next === "dark") void setThemePreference(next); }}><ToggleGroupItem id="light">{t("浅色")}</ToggleGroupItem><ToggleGroupItem id="dark">{t("深色")}</ToggleGroupItem></ToggleGroup></div>
      </header>

      <div className="design-system-content">
        <PreviewSection title={t("品牌")} description={t("Wispora 原始 Figma 导出：组合标志、图标和字标保持原始比例与 Display-P3 颜色，字标已转为轮廓。")}>
          <div className="brand-specimens">
            <BrandLogo className="brand-specimen-lockup" />
            <BrandLogo variant="mark" className="brand-specimen-mark" />
            <BrandLogo variant="wordmark" className="brand-specimen-wordmark" />
            <div className="brand-icon-sizes">{([16, 32, 48, 128] as const).map((size) => <figure key={size}><img src={`/icon/${size}.png`} width={size} height={size} alt={`Wispora ${size}px`} /><figcaption>{size}px</figcaption></figure>)}</div>
          </div>
        </PreviewSection>

        <PreviewSection title={t("颜色")} description={t("色块使用 Display-P3 渲染；数值以便于设计核对的大写十六进制参考值展示。")}>
          <div className="color-grid">{colorTokens.map(({ name, token, value, darkValue }) => <div className="color-swatch" key={name}><i style={{ background: `var(${token})` }} /><span>{name}</span><code>{isDark ? darkValue : value}</code></div>)}</div>
        </PreviewSection>

        <PreviewSection title={t("基础变量")} description={t("圆角、阴影、排版尺寸、间距、布局比例与动效变量。")}><FoundationPreview /></PreviewSection>
        <PreviewSection title={t("共享组件")} description={t("标签输入、菜单、弹窗、提示、滚动区域与设置布局的真实组件。")}><ComponentPreview /></PreviewSection>
        <PreviewSection title={t("字体")} description={t("所有文字使用系统默认无衬线字体，中英文、数字与标点由操作系统统一选择；字重使用 400、500、600、700。")}>
          <div className="type-specimens">
            <div><span>Brand / Dinish Condensed Bold · Figma SVG</span><BrandLogo variant="wordmark" className="display-wordmark" /></div>
            <div><span>Headline / System UI · 600</span><p className="headline-type">{t("发现看到的美好")}</p></div>
            <div><span>Interface / System UI</span><p>{t("搜索设计、创意或关键词……「Wispora UI」2026，快速找回真正有用的内容。")}</p></div>
            <div><span>Content title &amp; tag / System UI</span><p className="content-title-type">{t("Design Systems 设计系统 · React 组件库")}</p></div>
            <div><span>Description / System Sans</span><p className="description-type">{t("A readable description 使用系统字体呈现，适合连续阅读。")}</p></div>
            <div><span>Metadata / System UI</span><code>collectui.com · Last updated: 3 hours ago</code></div>
            {([{ weight: 400, name: "Regular" }, { weight: 500, name: "Medium" }, { weight: 600, name: "Semibold" }, { weight: 700, name: "Bold" }] as const).map(({ weight, name }) => <div key={weight}><span>{name} / {weight} · 15px</span><p style={{ fontWeight: weight }}>{t("稍后阅读 · Wispora UI · 0123456789")}</p></div>)}
          </div>
        </PreviewSection>

        <PreviewSection title={t("按钮与控件")} description={t("通过既有 variant 扩展语义，而不是创建相似按钮。")}>
          <div className="component-stack">
            <div className="component-row">
              <Button variant="primary"><RiAddLine size={16} />{t("添加链接")}</Button>
              <Button variant="secondary"><RiSettings3Line size={16} />{t("管理标签")}</Button>
              <Button variant="contrast">{t("查看全部结果")}</Button>
              <Button variant="ghost">{t("取消")}</Button>
              <Button variant="preset">{t("预设")}</Button>
              <Button variant="preset" aria-current="true">{t("当前预设")}</Button>
              <Button variant="danger"><RiErrorWarningLine size={16} />{t("删除")}</Button>
              <Button variant="primary" isDisabled>{t("正在保存")}</Button>
            </div>
            <div className="component-row">
              <Switch label={t("自动整理")} description={t("保存后生成描述与标签")} isSelected={previewSwitch} onChange={setPreviewSwitch} />
              <Switch label={t("停用状态")} isDisabled />
              <RadioGroup className="ai-key-storage" label={t("保存方式")} value={previewStorage} onChange={setPreviewStorage} options={[{ value: "session", label: t("仅当前会话") }, { value: "local", label: t("本地浏览器") }]} />
              <Badge>{t("产品设计")}</Badge><Badge variant="neutral">React Aria</Badge>
              <FacetFilter label={t("标签")} icon={<RiPriceTag3Line size={15} aria-hidden="true" />} options={[{ id: "design", label: t("设计"), count: 15 }, { id: "react", label: "React", count: 8 }, { id: "motion", label: t("动效"), count: 6 }]} selectedValues={previewTags} onChange={setPreviewTags} searchable searchPlaceholder={t("搜索标签")} />
              <SelectMenu label={t("排序方式")} value={previewSort} options={[{ value: "newest", label: t("最新") }, { value: "oldest", label: t("最旧") }]} onChange={setPreviewSort} icon={<RiArrowUpDownLine size={15} aria-hidden="true" />} />
              <AiModelSelect provider="gemini" value={previewModel} onChange={setPreviewModel} />
              <LibraryLayoutSelect value={previewLayout} onChange={setPreviewLayout} />
            </div>
            <SelectedTagBar tags={["设计", "React", "动效", "组件库", "可访问性"]} onRemove={() => undefined} actions={<div className="filter-result-actions"><Button variant="secondary" size="sm">{t("保存为快捷视图")}</Button><Button variant="ghost" size="sm">{t("清除全部")}</Button></div>} />
          </div>
        </PreviewSection>

        <PreviewSection title={t("搜索面板")} description={t("Intent UI Command Menu；类型与收藏时间单选、标签及字段多选；默认记录、筛选与结果使用独立状态。")}>
          <SearchPreview />
          <div className="component-row" aria-label={t("快捷键提示")}><KeyboardShortcut keys={["⌘", "K"]} /><KeyboardShortcut keys={["Esc"]} /><KeyboardShortcut keys={["⌘", "↵"]} /><KeyboardShortcut keys={["Ctrl", "K"]} /></div>
        </PreviewSection>

        <PreviewSection title={t("侧栏导航")} description={t("使用设计稿原始图标；系统视图固定，用户视图支持改名、删除和拖动排序。")}>
          <div className="sidebar-component-preview">
            <div className="nav-list">
              <SidebarNavItem icon={<SidebarIcon src="/assets/sidebar/inbox.svg" />} label={t("全部")} count={22} isActive={!activePreviewView} onPress={() => setActivePreviewView("")} />
              <SidebarNavItem icon={<SidebarIcon src="/assets/sidebar/article.svg" />} label={t("文章")} count={1} onPress={() => setActivePreviewView("")} />
            </div>
            <p className="nav-label">{t("快捷视图")}</p>
            <SavedViewReorderList views={previewViews} activeViewId={activePreviewView} onSelect={setActivePreviewView} onRename={(id, name) => setPreviewViews((current) => current.map((item) => item.id === id ? { ...item, name } : item))} onDelete={(id) => setPreviewViews((current) => current.filter((item) => item.id !== id || item.isSystem))} onMove={movePreviewView} showTooltip={false} />
          </div>
        </PreviewSection>

        <PreviewSection title={t("筛选胶囊")} description={t("Intent UI Toggle Group；单选可取消，多选可组合，保留键盘焦点与禁用状态。")}>
          <div className="component-stack">
          <ToggleGroup label={t("搜索字段胶囊示例")} selectionMode="multiple" selectedKeys={previewChipKeys} onSelectionChange={(keys) => setPreviewChipKeys(new Set([...keys].map(String)))}><ToggleGroupItem id="title">{t("标题")}</ToggleGroupItem><ToggleGroupItem id="description">{t("描述")}</ToggleGroupItem><ToggleGroupItem id="disabled" isDisabled>{t("禁用选项")}</ToggleGroupItem></ToggleGroup>
          <ToggleGroup label={t("横向标签胶囊示例")} selectionMode="multiple" scrollable>{["组件库", "设计系统", "设计工具", "图标库", "个人网站", "交互动效", "开发资源", "排版参考", "网页设计", "资源导航"].map((name) => <ToggleGroupItem key={name} id={name}>#{t(name)}</ToggleGroupItem>)}</ToggleGroup>
          <div className="component-row">{[...previewChipKeys].map((key) => <Badge key={key} variant="choice" removable onPress={() => setPreviewChipKeys((current) => new Set([...current].filter((value) => value !== key)))} aria-label={tf("移除示例 {name}", { name: key === "title" ? t("标题") : t("描述") })}>{key === "title" ? "标题" : "描述"}</Badge>)}</div>
          </div>
        </PreviewSection>

        <PreviewSection title={t("多选选项")} description={t("Intent UI Checkbox Group；覆盖选中、未选、禁用、键盘焦点及错误状态。")}>
          <div className="component-stack"><CheckboxGroup label={t("搜索字段示例")} value={checkedFields} onChange={setCheckedFields} description={t("可同时选择多个字段")}><div className="checkbox-group-options"><CheckboxField value="title"><Checkbox>{t("标题")}</Checkbox></CheckboxField><CheckboxField value="description"><Checkbox>{t("描述")}</Checkbox></CheckboxField><CheckboxField value="partial" isIndeterminate><Checkbox>{t("部分选择")}</Checkbox></CheckboxField><CheckboxField value="domain" isDisabled><Checkbox>{t("域名（禁用）")}</Checkbox></CheckboxField></div></CheckboxGroup><CheckboxGroup label={t("需要选择至少一项")} isInvalid value={[]}><CheckboxField value="example"><Checkbox>{t("错误状态")}</Checkbox></CheckboxField></CheckboxGroup></div>
        </PreviewSection>
        <PreviewSection title={t("表单")} description={t("输入、搜索与描述共享焦点、圆角和表面规范。")}>
          <div className="form-preview">
            <Field label={t("名称")} defaultValue="Intent UI" />
            <Field label={t("来源链接")} defaultValue="https://intentui.com" />
            <Field label={t("描述（可选）")} placeholder={t("写下一段便于以后识别的描述")} multiline />
            <CompactSearchField aria-label={t("搜索示例")} placeholder={t("搜索标签")} value={previewSearch} onChange={setPreviewSearch} />
          </div>
        </PreviewSection>

        <PreviewSection title={t("内容卡片")} description={t("卡片与紧凑卡片复用领域卡片，列表使用 Figma 列表组件，并根据网站、文章和关注源调整内容结构。")}>
          <div className="card-layout-specimens">
            <div><span>{t("卡片排列")}</span><div className="card-preview-grid">{inspirationItems.slice(0, 3).map((item) => <InspirationCard key={item.id} item={item} layout="cards" onOpen={() => undefined} onTagClick={() => undefined} onToggleFavorite={() => undefined} />)}</div></div>
            <div><span>{t("紧凑卡片")}</span><div className="compact-preview-grid">{inspirationItems.slice(0, 3).map((item) => <InspirationCard key={item.id} item={item} layout="compact" onOpen={() => undefined} onTagClick={() => undefined} onToggleFavorite={() => undefined} />)}</div></div>
            <div><span>{t("紧凑列表")}</span><div className="inspiration-list">{inspirationItems.slice(0, 3).map((item) => <InspirationListItem key={item.id} item={item} variant="compact" onOpen={() => undefined} onTagClick={() => undefined} onToggleFavorite={() => undefined} />)}</div></div>
            <div><span>{t("列表排列")}</span><div className="inspiration-list">{inspirationItems.slice(0, 3).map((item) => <InspirationListItem key={item.id} item={item} onOpen={() => undefined} onTagClick={() => undefined} onToggleFavorite={() => undefined} />)}</div></div>
          </div>
        </PreviewSection>

        <PreviewSection title={t("简报")} description={t("往期封面卡片复用 Card、CoverArt 与现有 token；红点只表示未读。此处使用演示内容。")}>
          <div className="digest-edition-grid">
            <DigestEditionCard digest={digestPreview} href="#design-system" />
            <DigestEditionCard digest={{ ...digestPreview, readAt: Date.now() }} href="#design-system" />
          </div>
          <DigestReadingRail preview visible sections={[{ id: "preview-websites", label: t("网站"), entries: digestPreview.entries.slice(0, 3) }, { id: "preview-articles", label: t("文章"), entries: digestPreview.entries.slice(3, 5) }]} activeSectionId="preview-websites" activeAnchorId={digestEntryAnchor("preview-websites", digestPreview.entries[0]!.id)} />
        </PreviewSection>

        <PreviewSection title={t("添加入口")} description={t("悬停、聚焦或点击主按钮后，展开带背景模糊的内容类型菜单，文字保持在按钮点击区域内。")}>
          <FloatingAddMenu placement="preview" onSelect={() => undefined} />
        </PreviewSection>

        <PreviewSection title={t("Toast 通知")} description={t("顶部通知支持标题、补充说明、操作、队列、异步状态更新与持续型通知关闭；悬停、聚焦和页面进入后台时暂停计时。")}>
          <div className="component-stack">
            <div className="component-row">
              <Button variant="secondary" onPress={() => showToast(t("链接已复制"), { tone: "neutral" })}>{t("默认")}</Button>
              <Button variant="secondary" onPress={() => showToast(t("发现新的版本"), { description: t("重新打开工作台后即可使用。"), tone: "info" })}>{t("提示")}</Button>
              <Button variant="secondary" onPress={() => showToast(t("操作已完成"), { tone: "success" })}>{t("成功")}</Button>
              <Button variant="secondary" onPress={() => showToast(t("部分网站未补全"), { description: t("收藏已保存，可稍后重新整理。"), tone: "warning" })}>{t("警告")}</Button>
              <Button variant="secondary" onPress={() => showToast(t("复制链接失败"), { description: t("请检查浏览器剪贴板权限后重试。"), tone: "danger" })}>{t("错误")}</Button>
            </div>
            <div className="component-row">
              <Button variant="secondary" onPress={() => showToast(t("已应用筛选"), { action: { label: t("查看"), onPress: () => { showToast(t("当前正在查看筛选结果"), { tone: "info" }); } } })}>{t("普通操作")}</Button>
              <Button variant="secondary" onPress={() => showUndoToast(t("已删除收藏项"), { subject: "Rows is an unapologetically creative design collection", onUndo: () => { showToast(t("已撤回删除"), { tone: "success" }); } })}>{t("删除撤回")}</Button>
              <Button variant="secondary" onPress={() => showUndoToast(t("已添加 4 个收藏项"), { onUndo: () => { showToast(t("已撤回批量添加"), { tone: "success" }); } })}>{t("批量撤回")}</Button>
              <Button variant="secondary" onPress={previewLoadingToast}>{t("异步状态")}</Button>
            </div>
          </div>
        </PreviewSection>

        <PreviewSection title={t("布局与反馈")} description={t("面板靠色调和间距分层；关键反馈同时使用图标与文字。")}>
          <div className="layout-preview">
            <Card className="layout-nav"><strong>{t("内容类型")}</strong><span className="is-selected">{t("网站")}</span><span>{t("文章")}</span><span>{t("关注源")}</span></Card>
            <Card className="layout-main"><div className="feedback success"><RiCheckLine size={16} /><span><strong>{t("添加成功")}</strong>{t("链接已保存，正在后台整理。")}</span></div><div className="skeleton-lines"><i /><i /><i /></div></Card>
          </div>
        </PreviewSection>
        <PreviewSection title={t("收藏库空状态")} description={t("区分首次添加、当前范围为空和筛选无结果；恢复操作与当前状态一致。")}>
          <div className="empty-state-preview">
            {(["library", "scope", "filtered"] as const).map((kind) => <LibraryEmptyState key={kind} kind={kind} scope="favorites" scopeTitle={t("星标")} onAdd={() => showToast(t("添加网站"))} onImport={() => showToast(t("导入收藏"))} onShowAll={() => showToast(t("查看全部收藏"))} onClear={() => showToast(t("清除搜索与筛选"))} onSearch={() => showToast(t("调整搜索与筛选"))} />)}
          </div>
        </PreviewSection>
      </div>
    </div>
  );
}
