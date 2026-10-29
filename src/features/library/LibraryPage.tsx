import { RiArchiveLine, RiArrowUpDownLine, RiBookmarkFill, RiBookmarkLine, RiDeleteBinLine, RiEditLine, RiExternalLinkLine, RiFileCopyLine, RiFunctionLine, RiListCheck, RiListCheck2, RiListUnordered, RiPriceTag3Line, RiSearchLine, RiSparkling2Line, RiTextSnippet } from "@remixicon/react";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FloatingAddMenu } from "@/src/components/inspiration/FloatingAddMenu";
import type { ExtensionRequest } from "@/src/capture/types";
import { InspirationCard, type InspirationLayout } from "@/src/components/inspiration/InspirationCard";
import { InspirationListItem } from "@/src/components/inspiration/InspirationListItem";
import { AppShell } from "@/src/components/layout/AppShell";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { SearchTrigger } from "@/src/components/ui/SearchTrigger";
import { ContextMenu, type ContextMenuAction } from "@/src/components/ui/ContextMenu";
import { FacetFilter } from "@/src/components/ui/FacetFilter";
import { SegmentedControl } from "@/src/components/ui/SegmentedControl";
import { SelectMenu } from "@/src/components/ui/SelectMenu";
import { SelectedTagBar } from "@/src/components/ui/SelectedTagBar";
import { useToast } from "@/src/components/ui/Toast";
import { seedDevelopmentData } from "@/src/db/developmentSeed";
import { inspirationRepository, type DeletedSavedItem } from "@/src/db/repository";
import { type LibraryItem, type LibraryScope, type SavedItemKind, type UpdateSavedItemInput } from "@/src/domain/inspiration";
import { selectSearchPreview, createSearchPresentations, createLibrarySearchIndex, queryLibraryItems, type LibrarySortOrder } from "@/src/search/librarySearch";
import { hasSearchResultIntent, readSearchFields, readSearchScope, readSearchTimeRange, searchConditionCount, searchFieldLabels, searchTimeLabels, type LibraryQuery } from "@/src/search/searchQuery";
import { searchHistoryRepository } from "@/src/search/searchHistory";
import { primaryModifier } from "@/src/lib/platform";
import { cn } from "@/src/lib/cn";
import { DataImportDialog } from "./DataImportDialog";
import { AiSettingsDialog } from "./AiSettingsDialog";
import { ArchiveDialog } from "./ArchiveDialog";
import { BackupDialog } from "./BackupDialog";
import { DetailDialog } from "./DetailDialog";
import { ImportDialog } from "./ImportDialog";
import { TagManagerDialog } from "./TagManagerDialog";
import { LibrarySkeleton } from "./LibrarySkeleton";
import { LibrarySearchDialog, type SearchPosition, type SearchDraft } from "./LibrarySearchDialog";
import { t, tf } from "@/src/i18n/ui";

type LayoutMode = InspirationLayout | "compact-list";
type SortOrder = LibrarySortOrder;
interface SearchSession extends SearchDraft {
  mode: "search" | "preview";
  previewId: string | null;
}
const emptyItems: LibraryItem[] = [];
const kindLabels = { website: "网站", article: "文章", follow: "关注源" } as const;
const layoutOptions = [
  { value: "cards", label: "详情卡片", icon: <RiFunctionLine size={15} aria-hidden="true" /> },
  { value: "compact", label: "紧凑卡片", icon: <RiListCheck2 size={15} aria-hidden="true" /> },
  { value: "list", label: "详情列表", icon: <RiListCheck size={15} aria-hidden="true" /> },
  { value: "compact-list", label: "紧凑列表", icon: <RiListUnordered size={15} aria-hidden="true" /> },
] as const;
const sortOptions = [
  { value: "newest", label: "最新" },
  { value: "oldest", label: "最旧" },
] as const;
const relevanceOption = { value: "relevance", label: "最相关" } as const;

const validScopes = new Set<LibraryScope>(["all", "unprocessed", "favorites", "website", "article", "follow"]);

function readInitialState() {
  const params = new URLSearchParams(location.search);
  const scope = params.get("scope") as LibraryScope | null;
  return {
    scope: scope && validScopes.has(scope) ? scope : "all" as LibraryScope,
    query: params.get("q") ?? "",
    tags: [...params.getAll("tagId"), ...params.getAll("tag").map((name) => `legacy-tag:${name}`)],
    fields: readSearchFields(params.getAll("field")),
    timeRange: readSearchTimeRange(params.get("time")),
    sort: params.get("sort") === "relevance" && params.get("q")?.trim() ? "relevance" as const : params.get("sort") === "oldest" ? "oldest" as const : "newest" as const,
    layout: params.get("layout") === "compact-list" ? "compact-list" as const : params.get("layout") === "compact" ? "compact" as const : params.get("layout") === "list" ? "list" as const : "cards" as const,
    item: params.get("item"),
    view: params.get("view"),
  };
}

export function LibraryPage() {
  const { showToast, showUndoToast } = useToast();
  const initialState = useMemo(readInitialState, []);
  const liveItems = useLiveQuery(() => inspirationRepository.listLibraryItems(), []);
  const liveTags = useLiveQuery(() => inspirationRepository.listTags(), []);
  const liveViews = useLiveQuery(() => inspirationRepository.listLibrarySavedViews(), []);
  const items = liveItems ?? emptyItems;
  const views = liveViews ?? [];
  const [activeScope, setActiveScope] = useState<LibraryScope>(initialState.scope);
  const [activeSavedView, setActiveSavedView] = useState<string | null>(initialState.view);
  const [selectedSearchFields, setSearchFields] = useState(initialState.fields);
  const [selectedSearchTime, setSearchTime] = useState(initialState.timeRange);
  const [query, setQuery] = useState(initialState.query);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialState.tags);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialState.sort);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(initialState.layout);
  const [selectedId, setSelectedId] = useState<string | null>(initialState.item);
  const [importKind, setImportKind] = useState<SavedItemKind | null>(null);
  const [bookmarkImportOpen, setBookmarkImportOpen] = useState(false);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ itemId: string; x: number; y: number; trigger: HTMLElement } | null>(null);
  const [detailIntent, setDetailIntent] = useState<{ mode: "details" | "snapshot"; editing: boolean; editFocus?: "tags" }>({ mode: "details", editing: false });
  const searchRef = useRef<HTMLButtonElement>(null);
  const [searchSession, setSearchSession] = useState<SearchSession | null>(null);
  const [indexRevision, setIndexRevision] = useState(0);
  const searchPosition = useRef<SearchPosition>({ activeId: null, scrollTop: 0 });
  const searchScrollRef = useRef(0);
  const detailTriggerRef = useRef<HTMLElement | null>(null);
  const detailScrollRef = useRef(0);

  useEffect(() => {
    // URL 同步 effect 会在挂载后重写地址栏，必须在它之前同步读取 seed 参数
    const shouldSeed = new URLSearchParams(window.location.search).get("seed") === "demo";
    void inspirationRepository.initialize().then(() => seedDevelopmentData(inspirationRepository, shouldSeed));
  }, []);

  useEffect(() => {
    if (!liveTags) return;
    setSelectedTags((current) => current.some((id) => id.startsWith("legacy-tag:")) ? current.map((id) => id.startsWith("legacy-tag:") ? liveTags.find((tag) => tag.name === id.slice(11))?.id ?? id : id) : current);
  }, [liveTags]);

  useEffect(() => {
    // Resolve old tag-name links before emitting canonical ID parameters.
    if (selectedTags.some((id) => id.startsWith("legacy-tag:") && (!liveTags || liveTags.some((tag) => tag.name === id.slice(11))))) return;
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (!selectedSearchFields.includes("all")) selectedSearchFields.forEach((field) => params.append("field", field));
    if (activeScope !== "all") params.set("scope", activeScope);
    if (selectedSearchTime !== "all") params.set("time", selectedSearchTime);
    selectedTags.forEach((tag) => params.append("tagId", tag));
    if (sortOrder !== "newest" && (sortOrder !== "relevance" || query.trim())) params.set("sort", sortOrder);
    if (layoutMode !== "cards") params.set("layout", layoutMode);
    if (selectedId) params.set("item", selectedId);
    if (activeSavedView) params.set("view", activeSavedView);
    const next = params.size ? `?${params}` : location.pathname;
    history.replaceState(null, "", next);
  }, [activeSavedView, activeScope, layoutMode, query, selectedSearchFields, selectedSearchTime, selectedId, selectedTags, sortOrder, liveTags]);

  const allTags = liveTags ?? [];
  const tagName = (id: string) => allTags.find((tag) => tag.id === id)?.name ?? t("标签已删除");
  const tagId = (name: string) => allTags.find((tag) => tag.name === name)?.id ?? `legacy-tag:${name}`;

  const currentView = views.find((view) => view.id === activeSavedView) ?? null;
  const searchIndex = useMemo(() => {
    try { return createLibrarySearchIndex(items); }
    catch { return null; }
  }, [items, indexRevision]);
  const effectiveTags = useMemo(() => [...new Set([...selectedTags, ...(currentView?.tagIds ?? [])])], [selectedTags, currentView]);
  const visibleItems = useMemo(() => {
    try { return queryLibraryItems(items, searchIndex, { query, scope: activeScope, tagIds: effectiveTags, fields: selectedSearchFields, timeRange: selectedSearchTime, sort: sortOrder }); }
    catch { return []; }
  }, [activeScope, effectiveTags, items, query, searchIndex, selectedSearchFields, selectedSearchTime, sortOrder]);
  const draftScope = searchSession?.scope ?? activeScope;
  const draftFields = searchSession?.fields ?? selectedSearchFields;
  const draftTags = searchSession?.tagIds ?? effectiveTags;
  const draftTime = searchSession?.timeRange ?? selectedSearchTime;
  const searchItems = useCallback((draft: string) => {
    const options = { query: draft, scope: draftScope, fields: draftFields, tagIds: draftTags, timeRange: draftTime };
    const matches = queryLibraryItems(items, searchIndex, { ...options, sort: draft.trim() ? "relevance" : "newest" });
    return { items: matches, presentations: createSearchPresentations(matches, searchIndex, draft, draftFields) };
  }, [items, searchIndex, draftScope, draftFields, draftTags, draftTime]);
  const previewItems = useMemo(() => {
    if (searchSession?.mode !== "preview") return [];
    try { return selectSearchPreview(searchItems(searchSession.query).items, hasSearchResultIntent(searchSession)); }
    catch { return []; }
  }, [searchSession?.mode, searchSession?.query, searchSession?.tagIds, searchSession?.timeRange, searchSession?.scope, searchItems]);

  const viewTitle = currentView ? currentView.isSystem ? t(currentView.name) : currentView.name : (activeScope === "all" ? t("全部内容") : activeScope === "favorites" ? t("星标") : activeScope === "unprocessed" ? t("未处理") : t(kindLabels[activeScope]));
  const previewing = searchSession?.mode === "preview";
  const selectedItem = items.find((item) => item.id === (previewing ? searchSession.previewId : selectedId) && !item.archivedAt) ?? null;
  const selectedSiteItemCount = selectedItem ? items.filter((item) => item.siteHost === selectedItem.siteHost).length : 0;
  const conditionCount = searchConditionCount({ query, scope: activeScope, fields: selectedSearchFields, tagIds: effectiveTags, timeRange: selectedSearchTime });
  const modifier = primaryModifier();
  const openSearch = useCallback(() => {
    if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
    searchScrollRef.current = window.scrollY;
    searchPosition.current = { activeId: null, scrollTop: 0 };
    setSearchSession({ mode: "search", query, scope: readSearchScope(activeScope), tagIds: effectiveTags, fields: selectedSearchFields, timeRange: selectedSearchTime, savedViewId: currentView && currentView.scope === readSearchScope(activeScope) ? currentView.id : null, previewId: null, filtersOpen: false, immediateRevision: 0 });
  }, [activeScope, query, selectedSearchFields, selectedSearchTime, effectiveTags, currentView]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (event.defaultPrevented || event.isComposing || event.repeat || event.altKey || event.shiftKey || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select"))) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      event.preventDefault();
      openSearch();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openSearch]);

  useEffect(() => {
    if (previewing && liveItems !== undefined && !selectedItem) {
      setSearchSession((current) => current ? { ...current, mode: "search", previewId: null } : null);
      showToast(t("该收藏项已不可用"), { tone: "info" });
    }
  }, [previewing, liveItems, selectedItem, showToast]);

  const cancelSearch = () => {
    setSearchSession(null);
    requestAnimationFrame(() => {
      window.scrollTo({ top: searchScrollRef.current });
      searchRef.current?.focus({ preventScroll: true });
    });
  };
  const submitSearch = (draft: LibraryQuery) => {
    setQuery(draft.query);
    setActiveScope(draft.scope);
    setSelectedTags(draft.tagIds);
    setSearchFields(draft.fields);
    setSearchTime(draft.timeRange ?? "all");
    const chosenView = views.find((view) => view.id === searchSession?.savedViewId);
    setActiveSavedView(chosenView && chosenView.scope === draft.scope && chosenView.tagIds.length === draft.tagIds.length && chosenView.tagIds.every((id) => draft.tagIds.includes(id)) ? chosenView.id : null);
    setSortOrder(draft.query ? "relevance" : "newest");
    void searchHistoryRepository.record(draft);
    setSearchSession(null);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0 });
      searchRef.current?.focus({ preventScroll: true });
    });
  };
  const resetBrowseControls = () => { setSelectedTags([]); setSortOrder("newest"); };
  const changeScope = (scope: LibraryScope) => { setActiveScope(scope); setActiveSavedView(null); resetBrowseControls(); };
  const changeSavedView = (id: string) => {
    const view = views.find((candidate) => candidate.id === id);
    setActiveSavedView(id);
    setActiveScope(view?.scope ?? "all");
    setSelectedTags(view?.tagIds ?? []);
    setSortOrder("newest");
  };
  const renameSavedView = async (id: string, name: string) => {
    await inspirationRepository.renameSavedView(id, name);
    showToast(t("快捷视图已保存"), { tone: "success" });
  };
  const deleteSavedView = async (id: string) => {
    await inspirationRepository.deleteSavedView(id);
    setActiveSavedView((current) => current === id ? null : current);
    showToast(t("快捷视图已删除"), { tone: "success" });
  };
  const moveSavedView = (sourceId: string, targetId: string) => {
    void inspirationRepository.moveSavedView(sourceId, targetId);
  };
  const createSavedView = async () => {
    const view = await inspirationRepository.createSavedView({ name: t("新快捷视图"), scope: activeScope, tags: selectedTags.map(tagName) });
    setActiveSavedView(view.id);
    showToast(t("快捷视图已保存"), { tone: "success" });
  };
  const toggleFavorite = (id: string) => { void inspirationRepository.toggleFavorite(id); };
  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast(t("链接已复制"), { tone: "success" });
    } catch {
      showToast(t("复制链接失败"), { tone: "danger" });
    }
  };
  const archiveItem = async (id: string, archived: boolean) => {
    const item = items.find((candidate) => candidate.id === id);
    await inspirationRepository.setArchived(id, archived);
    showUndoToast(archived ? t("已归档收藏项") : t("已取消归档"), {
      subject: item?.title,
      onUndo: async () => {
        try {
          await inspirationRepository.setArchived(id, !archived);
          showToast(archived ? t("已撤回归档") : t("已恢复归档"), { tone: "success" });
        } catch {
          showToast(t("撤回归档失败，请稍后重试"), { tone: "danger" });
        }
      },
    });
  };
  const restoreDeletedItem = async (deleted: DeletedSavedItem) => {
    try {
      const restored = await inspirationRepository.restoreSavedItem(deleted);
      showToast(restored ? t("已撤回删除") : t("撤回失败：收藏项已存在"), { tone: restored ? "success" : "danger" });
    } catch {
      showToast(t("撤回失败，请稍后重试"), { tone: "danger" });
    }
  };
  const deleteItem = async (id: string) => {
    const deleted = await inspirationRepository.deleteSavedItem(id);
    if (!deleted) return;
    showUndoToast(t("已删除收藏项"), { subject: deleted.item.title, onUndo: () => restoreDeletedItem(deleted) });
  };
  const undoAddedItems = async (ids: string[]) => {
    try {
      await inspirationRepository.deleteSavedItems(ids);
      showToast(ids.length === 1 ? t("已撤回添加") : t("已撤回批量添加"), { tone: "success" });
    } catch {
      showToast(t("撤回添加失败，请稍后重试"), { tone: "danger" });
    }
  };
  const updateItem = async (input: UpdateSavedItemInput) => {
    if (!selectedItem) return;
    const kindChanged = await inspirationRepository.updateSavedItem(selectedItem.id, input);
    if (kindChanged) {
      void browser.runtime.sendMessage({ type: "ai:process" } satisfies ExtensionRequest);
      showToast(t("内容类型已更改，AI 整理已重新排队"), { tone: "info" });
      return;
    }
    showToast(t("修改已保存"), { tone: "success" });
  };

  function navigateDetail(direction: -1 | 1) {
    if (previewing) {
      const index = previewItems.findIndex((item) => item.id === searchSession.previewId);
      const next = previewItems[(index + direction + previewItems.length) % previewItems.length];
      if (next) {
        searchPosition.current.activeId = next.id;
        setSearchSession((current) => current ? { ...current, previewId: next.id } : null);
      }
      return;
    }
    if (!selectedId || visibleItems.length === 0) return;
    const index = visibleItems.findIndex((item) => item.id === selectedId);
    const next = visibleItems[(index + direction + visibleItems.length) % visibleItems.length];
    if (next) setSelectedId(next.id);
  }

  function openDetail(id: string, intent: { mode?: "details" | "snapshot"; editing?: boolean; editFocus?: "tags" } = {}) {
    detailTriggerRef.current = document.activeElement as HTMLElement | null;
    detailScrollRef.current = window.scrollY;
    setDetailIntent({ mode: intent.mode ?? "details", editing: intent.editing ?? false, editFocus: intent.editFocus });
    setSelectedId(id);
  }

  function closeDetail() {
    if (previewing) {
      setSearchSession((current) => current ? { ...current, mode: "search", previewId: null } : null);
      return;
    }
    setSelectedId(null);
    requestAnimationFrame(() => {
      window.scrollTo({ top: detailScrollRef.current });
      detailTriggerRef.current?.focus({ preventScroll: true });
    });
  }

  async function addItem({ kind, url, description, enrichMetadata }: { kind: SavedItemKind; url: string; description: string; enrichMetadata: boolean }) {
    const target = new URL(url);
    const permissionPattern = `${target.protocol}//${target.hostname}/*`;
    const permissionRequest = enrichMetadata
      ? browser.permissions.request({ origins: [permissionPattern] }).catch(() => false)
      : Promise.resolve(false);
    const [permissionGranted, result] = await Promise.all([
      permissionRequest,
      inspirationRepository.createSavedItem({ kind, url, description, captureMethod: "manual-url" }),
    ]);
    if (!result.created) {
      if (permissionGranted) await browser.permissions.remove({ origins: [permissionPattern] });
      return false;
    }
    if (permissionGranted) {
      try {
        await browser.runtime.sendMessage({ type: "capture:remote", itemId: result.item.id, url, permissionPattern } satisfies ExtensionRequest);
      } finally {
        await browser.permissions.remove({ origins: [permissionPattern] }).catch(() => false);
      }
    }
    void browser.runtime.sendMessage({ type: "ai:process" } satisfies ExtensionRequest);
    changeScope(kind);
    const addedItem = await inspirationRepository.getSavedItem(result.item.id);
    showUndoToast(t("已添加收藏项"), { subject: addedItem?.title ?? result.item.title, onUndo: () => undoAddedItems([result.item.id]) });
    return true;
  }

  async function importItems(kind: SavedItemKind, urls: string[], enrichMetadata: boolean) {
    const origins = [...new Set(urls.map((url) => {
      const target = new URL(url);
      return `${target.protocol}//${target.hostname}/*`;
    }))];
    const permissionRequest = enrichMetadata
      ? browser.permissions.request({ origins }).catch(() => false)
      : Promise.resolve(false);
    const [permissionGranted, result] = await Promise.all([
      permissionRequest,
      inspirationRepository.importUrls(kind, urls),
    ]);
    if (permissionGranted && result.addedItems.length > 0) {
      const items = result.addedItems.map(({ id, url }) => {
        const target = new URL(url);
        return { itemId: id, url, permissionPattern: `${target.protocol}//${target.hostname}/*` };
      });
      try {
        await browser.runtime.sendMessage({ type: "capture:remote-batch", items } satisfies ExtensionRequest);
      } finally {
        await browser.permissions.remove({ origins }).catch(() => false);
      }
    } else if (permissionGranted) {
      await browser.permissions.remove({ origins }).catch(() => false);
    }
    void browser.runtime.sendMessage({ type: "ai:process" } satisfies ExtensionRequest);
    if (result.added > 0) {
      changeScope(kind);
      showUndoToast(tf("已添加 {count} 个收藏项", { count: result.added }), { onUndo: () => undoAddedItems(result.addedItems.map((item) => item.id)) });
    }
    return result;
  }

  const clearConditions = () => { setSearchTime("all"); setSearchFields(["all"]); setQuery(""); setSelectedTags([]); setSortOrder("newest"); setActiveSavedView(null); };
  const removeTag = (tag: string) => { setSelectedTags((current) => current.filter((value) => value !== tag)); setActiveSavedView(null); };
  const contextItem = contextMenu ? items.find((item) => item.id === contextMenu.itemId) ?? null : null;
  const openItemContextMenu = (event: React.MouseEvent<HTMLElement>, itemId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ itemId, x: event.clientX, y: event.clientY, trigger: event.currentTarget });
  };
  const closeItemContextMenu = () => {
    const trigger = contextMenu?.trigger;
    setContextMenu(null);
    requestAnimationFrame(() => trigger?.focus({ preventScroll: true }));
  };
  const contextActions: ContextMenuAction[] = contextItem ? [
    { id: "visit", label: t("访问网页"), icon: <RiExternalLinkLine size={16} />, onAction: () => window.open(contextItem.url, "_blank", "noopener,noreferrer") },
    { id: "copy", label: t("复制链接"), icon: <RiFileCopyLine size={16} />, onAction: () => copyLink(contextItem.url) },
    { id: "favorite", label: contextItem.isFavorite ? t("取消星标") : t("星标"), icon: contextItem.isFavorite ? <RiBookmarkFill size={16} /> : <RiBookmarkLine size={16} />, separatorBefore: true, onAction: () => toggleFavorite(contextItem.id) },
    { id: "tags", label: t("标签"), icon: <RiPriceTag3Line size={16} />, onAction: () => openDetail(contextItem.id, { editing: true, editFocus: "tags" }) },
    { id: "edit", label: t("编辑信息"), icon: <RiEditLine size={16} />, onAction: () => openDetail(contextItem.id, { editing: true }) },
    { id: "snapshot", label: t("查看快照"), icon: <RiTextSnippet size={16} />, separatorBefore: true, onAction: () => openDetail(contextItem.id, { mode: "snapshot" }) },
    { id: "ai", label: t("AI 整理"), icon: <RiSparkling2Line size={16} />, onAction: async () => { await browser.runtime.sendMessage({ type: "ai:retry", itemId: contextItem.id } satisfies ExtensionRequest); } },
    { id: "archive", label: contextItem.archivedAt ? t("取消归档") : t("归档"), icon: <RiArchiveLine size={16} />, separatorBefore: true, onAction: () => archiveItem(contextItem.id, !contextItem.archivedAt) },
    { id: "delete", label: t("删除"), icon: <RiDeleteBinLine size={16} />, danger: true, onAction: () => deleteItem(contextItem.id) },
  ] : [];

  return (
    <AppShell items={items} activeScope={activeScope} activeSavedView={activeSavedView} savedViews={views} onScopeChange={changeScope} onSavedViewChange={changeSavedView} onSavedViewRename={renameSavedView} onSavedViewDelete={deleteSavedView} onSavedViewMove={moveSavedView} onOpenSettings={() => { window.location.hash = "#settings"; }}>
      <div className="library-page">
        <header className="library-intro">
          <SearchTrigger ref={searchRef} query={query} placeholder={t("搜索收藏…")} conditionLabel={conditionCount ? tf("筛选 {count}", { count: conditionCount }) : undefined} shortcut={[modifier, "K"]} aria-label={query ? tf("搜索收藏：{query}，{count} 项筛选条件", { query, count: conditionCount }) : tf("搜索收藏，{count} 项筛选条件", { count: conditionCount })} onPress={openSearch} />
        </header>

        <div className="collection-toolbar">
          <div className="toolbar-main-row">
            <div className="toolbar-left">
              <div className="view-heading"><strong>{viewTitle}</strong><span>{visibleItems.length}</span></div>
              <div className="facet-filter-bar" aria-label={t("内容筛选")}>
                <FacetFilter label={t("标签")} icon={<RiPriceTag3Line size={15} aria-hidden="true" />} options={allTags.map((tag) => ({ id: tag.id, label: tag.name, count: tag.usageCount }))} selectedValues={selectedTags} onChange={(values) => { setSelectedTags(values); setActiveSavedView(null); }} searchable searchPlaceholder={t("搜索标签")} />
              </div>
            </div>
            <div className="toolbar-right">
              <SelectMenu<SortOrder> label={t("排序方式")} value={!query.trim() && sortOrder === "relevance" ? "newest" : sortOrder} options={(query.trim() ? [relevanceOption, ...sortOptions] : sortOptions).map((option) => ({ ...option, label: t(option.label) }))} onChange={setSortOrder} icon={<RiArrowUpDownLine size={15} aria-hidden="true" />} className="sort-control" />
              <SegmentedControl label={t("排列样式")} value={layoutMode} options={layoutOptions.map((option) => ({ ...option, label: t(option.label) }))} onChange={setLayoutMode} className="layout-switch" />
            </div>
          </div>
          {selectedSearchTime !== "all" ? <div className="library-search-field-condition"><Badge variant="neutral" size="sm" removable onPress={() => setSearchTime("all")} aria-label={tf("移除条件 {name}", { name: t(searchTimeLabels[selectedSearchTime]) })}>{t(searchTimeLabels[selectedSearchTime])}</Badge></div> : null}
          {!selectedSearchFields.includes("all") ? <div className="library-search-field-condition">{selectedSearchFields.map((field) => <Badge key={field} variant="neutral" size="sm" removable onPress={() => setSearchFields(readSearchFields(selectedSearchFields.filter((value) => value !== field)))} aria-label={tf("移除搜索字段 {name}", { name: t(searchFieldLabels[field]) })}>{t(searchFieldLabels[field])}</Badge>)}</div> : null}
          {selectedTags.length ? <SelectedTagBar tags={selectedTags} getLabel={tagName} onRemove={removeTag} actions={<div className="filter-result-actions"><Button variant="secondary" size="sm" onPress={createSavedView}>{t("保存为快捷视图")}</Button>{query.trim() || !selectedSearchFields.includes("all") || selectedSearchTime !== "all" ? <span className="search-filter-help">{t("仅保存范围和标签")}</span> : null}<Button variant="ghost" size="sm" onPress={clearConditions}>{t("清除全部")}</Button></div>} /> : null}
        </div>

        <div className={cn("library-results", "t-skel", liveItems !== undefined && "is-revealed")} aria-busy={liveItems === undefined} aria-live={liveItems === undefined ? "polite" : undefined}>
          {liveItems === undefined ? <span className="sr-only">{t("正在打开本地收藏库")}</span> : null}
          <div className="t-skel-skeleton is-pulsing"><LibrarySkeleton /></div>
          <div className="t-skel-content">
            {liveItems !== undefined ? !searchIndex && query.trim() ? <div className="empty-state"><h2>{t("本地搜索暂时不可用")}</h2><Button variant="secondary" onPress={clearConditions}>{t("返回浏览")}</Button></div> : visibleItems.length ? (layoutMode === "list" || layoutMode === "compact-list") ? <div className="inspiration-list">{visibleItems.map((item) => <InspirationListItem key={item.id} item={item} variant={layoutMode === "compact-list" ? "compact" : "detail"} onOpen={() => openDetail(item.id)} onContextMenu={(event) => openItemContextMenu(event, item.id)} onTagClick={(tag) => { setSelectedTags((current) => current.includes(tagId(tag)) ? current : [...current, tagId(tag)]); setActiveSavedView(null); }} onToggleFavorite={() => toggleFavorite(item.id)} />)}</div> : <div className={cn("inspiration-grid", layoutMode === "compact" && "is-compact")}>{visibleItems.map((item) => <InspirationCard key={item.id} item={item} layout={layoutMode} masonry onOpen={() => openDetail(item.id)} onContextMenu={(event) => openItemContextMenu(event, item.id)} onTagClick={(tag) => { setSelectedTags((current) => current.includes(tagId(tag)) ? current : [...current, tagId(tag)]); setActiveSavedView(null); }} onToggleFavorite={() => toggleFavorite(item.id)} />)}</div> : items.length === 0 ? <div className="empty-state"><div className="empty-mark"><RiPriceTag3Line size={22} /></div><h2>{t("建立你的第一个收藏项")}</h2><p>{t("添加网站、文章或关注源，刷新页面后它仍会留在这里。")}</p><Button variant="primary" onPress={() => setImportKind("website")}>{t("添加网站")}</Button></div> : <div className="empty-state"><div className="empty-mark"><RiSearchLine size={22} /></div><h2>{t("没有匹配的内容")}</h2><p>{t("调整筛选条件，或换一个搜索关键词后再试。")}</p><Button variant="secondary" onPress={clearConditions}>{t("清除筛选")}</Button></div> : null}
          </div>
        </div>
      </div>
      <FloatingAddMenu onSelect={setImportKind} />
      <ImportDialog kind={importKind} onClose={() => setImportKind(null)} onAdd={addItem} onBulkAdd={importItems} />
      <AiSettingsDialog isOpen={aiSettingsOpen} onClose={() => setAiSettingsOpen(false)} />
      <ArchiveDialog isOpen={archiveOpen} onClose={() => setArchiveOpen(false)} />
      <BackupDialog isOpen={backupOpen} onClose={() => setBackupOpen(false)} />
      <TagManagerDialog isOpen={tagManagerOpen} onClose={() => setTagManagerOpen(false)} />
      <DataImportDialog isOpen={bookmarkImportOpen} onClose={() => setBookmarkImportOpen(false)} onImport={(urls, enrichMetadata) => importItems("website", urls, enrichMetadata)} />
      {contextMenu && contextItem ? <ContextMenu label={tf("{title} 操作菜单", { title: contextItem.title })} position={contextMenu} actions={contextActions} onClose={closeItemContextMenu} /> : null}
      {searchSession?.mode === "search" ? <LibrarySearchDialog draft={searchSession} onDraftChange={(draft) => setSearchSession((current) => current ? { ...current, ...draft } : null)} onClose={cancelSearch} onSubmit={submitSearch} onPreview={(id) => { searchPosition.current.activeId = id; setSearchSession((current) => current ? { ...current, mode: "preview", previewId: id } : null); }} search={searchItems} ready={liveItems !== undefined && liveTags !== undefined && liveViews !== undefined} tags={allTags} onRetry={() => setIndexRevision((value) => value + 1)} libraryEmpty={!items.some((item) => !item.archivedAt)} position={searchPosition} /> : null}
      <DetailDialog item={selectedItem} initialMode={previewing ? "details" : detailIntent.mode} initialEditing={previewing ? false : detailIntent.editing} initialEditFocus={previewing ? undefined : detailIntent.editFocus} returnToSearch={previewing} onClose={closeDetail} onNavigate={navigateDetail} onUpdate={updateItem} onDelete={async () => { if (!selectedItem) return; await deleteItem(selectedItem.id); closeDetail(); }} siteItemCount={selectedSiteItemCount} onShowSite={previewing ? undefined : () => { if (!selectedItem) return; setQuery(selectedItem.siteHost); setSearchFields(["all"]); setSortOrder("relevance"); setActiveScope("all"); setSelectedTags([]); closeDetail(); }} />
    </AppShell>
  );
}
