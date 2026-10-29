import { RiHistoryLine, RiSearchLine, RiFilter3Line } from "@remixicon/react";
import { useCallback, useEffect, useId, useRef, useState, type MutableRefObject } from "react";
import { SiteIcon } from "@/src/components/inspiration/SiteIcon";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { CommandMenu, CommandMenuDescription, CommandMenuFooter, CommandMenuItem, CommandMenuLabel, CommandMenuList, CommandMenuSearch } from "@/src/components/ui/CommandMenu";
import { FacetFilter } from "@/src/components/ui/FacetFilter";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/ToggleGroup";
import { KeyboardShortcut } from "@/src/components/ui/KeyboardShortcut";
import { primaryModifier } from "@/src/lib/platform";
import { t, tf } from "@/src/i18n/ui";
import { selectSearchPreview, highlightSearchText } from "@/src/search/librarySearch";
import { expandSearchFields, hasSearchResultIntent, indexedSearchFields, readSearchFields, readSearchScope, searchFieldLabels, searchScopes, searchTimeLabels, searchTimeRanges, scopeLabels, type LibraryQuery, type SearchScope, type SearchTimeRange } from "@/src/search/searchQuery";
import { searchHistoryRepository, type RecentSearch, type SearchHistoryRepository } from "@/src/search/searchHistory";
import { useDebouncedSearch, type SearchItems } from "./useDebouncedSearch";

export interface SearchPosition { activeId: string | null; scrollTop: number }
export interface SearchDraft extends LibraryQuery {
  scope: SearchScope;
  timeRange: SearchTimeRange;
  savedViewId: string | null;
  filtersOpen: boolean;
  immediateRevision: number;
}
interface LibrarySearchDialogProps {
  draft: SearchDraft;
  onDraftChange: (draft: SearchDraft) => void;
  onClose: () => void;
  onSubmit: (query: LibraryQuery) => void;
  onPreview: (id: string) => void;
  search: SearchItems;
  ready: boolean;
  onRetry?: () => void;
  tags: ReadonlyArray<{ id: string; name: string }>;
  libraryEmpty?: boolean;
  position: MutableRefObject<SearchPosition>;
  historyRepository?: SearchHistoryRepository;
}
const kindLabels = { website: "网站", article: "文章", follow: "关注源" } as const;
function Highlight({ text, terms }: { text: string; terms: readonly string[] }) {
  return highlightSearchText(text, terms).map((part, i) => part.match ? <mark key={i}>{part.text}</mark> : part.text);
}

export function LibrarySearchDialog({ draft, onDraftChange, onClose, onSubmit, onPreview, search, ready, onRetry, tags, libraryEmpty = false, position, historyRepository = searchHistoryRepository }: LibrarySearchDialogProps) {
  const { query } = draft;
  const [composing, setComposing] = useState(false);
  const composingRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<RecentSearch[]>([]);
  const [historyError, setHistoryError] = useState(false);
  const filterId = useId();
  const filterCheckpoint = useRef(draft);
  const filterPosition = useRef({ ...position.current });
  const { items, presentations, pending, failed, runNow } = useDebouncedSearch(query, search, ready, composing, String(draft.immediateRevision));
  const showResults = hasSearchResultIntent(draft);
  const previewItems = selectSearchPreview(items, showResults);
  const focusId = previewItems.some((item) => item.id === position.current.activeId) ? position.current.activeId : previewItems[0]?.id;
  const focusRequest = `${query}:${draft.immediateRevision}:${previewItems.map((item) => item.id).join(",")}:${draft.filtersOpen}`;
  const modifier = primaryModifier();
  const onActiveChange = useCallback((id: string) => { position.current.activeId = id; }, [position]);
  const restoredScroll = useRef(false);
  const initialScroll = useRef(position.current.scrollTop);
  const resultScroll = useRef(position.current.scrollTop);
  const selectedFields = expandSearchFields(draft.fields) ?? [];
  const tagName = (id: string) => tags.find((tag) => tag.id === id)?.name ?? t("标签已删除");

  useEffect(() => {
    let active = true;
    void historyRepository.list().then((entries) => { if (active) setHistory(entries.filter((entry) => searchScopes.includes(entry.scope as SearchScope))); });
    return () => { active = false; };
  }, [historyRepository]);
  useEffect(() => {
    if (!pending && listRef.current && !restoredScroll.current) {
      const frame = requestAnimationFrame(() => {
        if (!listRef.current) return;
        listRef.current.scrollTop = initialScroll.current;
        position.current.scrollTop = listRef.current.scrollTop;
        restoredScroll.current = true;
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [pending, position, draft.filtersOpen]);

  const change = (patch: Partial<SearchDraft>, immediate = true) => {
    const scrollTop = draft.filtersOpen || immediate ? listRef.current?.scrollTop ?? 0 : 0;
    position.current = { activeId: null, scrollTop };
    initialScroll.current = scrollTop;
    if (!draft.filtersOpen) resultScroll.current = 0;
    restoredScroll.current = false;
    const savedViewId = patch.savedViewId !== undefined ? patch.savedViewId : "scope" in patch || "tagIds" in patch ? null : draft.savedViewId;
    onDraftChange({ ...draft, ...patch, savedViewId, immediateRevision: draft.immediateRevision + Number(immediate) });
  };
  const showFilters = (open: boolean, apply = false) => {
    if (open) {
      resultScroll.current = listRef.current?.scrollTop ?? 0;
      filterCheckpoint.current = draft;
      filterPosition.current = { ...position.current, scrollTop: resultScroll.current };
    }
    // Filter edits remain a draft until confirmed. Cancellation keeps the current
    // keyword while restoring only the filter values and prior result position.
    const checkpoint = filterCheckpoint.current;
    const restore = !open && !apply ? {
      scope: checkpoint.scope, tagIds: checkpoint.tagIds, fields: checkpoint.fields,
      timeRange: checkpoint.timeRange, savedViewId: checkpoint.savedViewId,
    } : {};
    initialScroll.current = open || apply ? 0 : resultScroll.current;
    if (!open) position.current = apply ? { activeId: null, scrollTop: 0 } : { ...filterPosition.current };
    restoredScroll.current = false;
    onDraftChange({ ...draft, ...restore, filtersOpen: open, immediateRevision: draft.immediateRevision + Number(!open) });
    if (!open) requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  };
  const submit = () => {
    if (runNow() !== null) onSubmit({ query: query.trim(), scope: draft.scope, tagIds: draft.tagIds, fields: draft.fields, timeRange: draft.timeRange });
  };
  const reset = () => {
    change({ scope: "all", tagIds: [], fields: ["all"], timeRange: "all", savedViewId: null });
    // The now-disabled clear action cannot keep focus. Keep Escape and typing
    // inside the command menu rather than falling through to modal dismissal.
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  };
  const clearHistory = async () => {
    const cleared = await historyRepository.clear();
    if (cleared) { setHistory([]); setHistoryError(false); }
    else setHistoryError(true);
  };
  const conditions = [
    ...(draft.scope !== "all" ? [{ id: "scope", label: t(scopeLabels[draft.scope]), remove: () => change({ scope: "all" }) }] : []),
    ...(draft.timeRange !== "all" ? [{ id: "time", label: t(searchTimeLabels[draft.timeRange]), remove: () => change({ timeRange: "all" }) }] : []),
    ...draft.tagIds.map((id) => ({ id: `tag:${id}`, label: `#${tagName(id)}`, remove: () => change({ tagIds: draft.tagIds.filter((value) => value !== id) }) })),
    ...selectedFields.map((field) => ({ id: `field:${field}`, label: t(searchFieldLabels[field]), remove: () => change({ fields: readSearchFields(selectedFields.filter((value) => value !== field)) }) })),
  ];
  const tagOptions = [...tags.map((tag) => ({ id: tag.id, label: `#${tag.name}` })), ...draft.tagIds.filter((id) => !tags.some((tag) => tag.id === id)).map((id) => ({ id, label: `#${t("标签已删除")}` }))];

  return (
    <CommandMenu isOpen isPending={pending} heightMode={draft.filtersOpen || !showResults ? "stable" : "content"} aria-label={t("搜索收藏")} inputValue={query} onInputChange={(value) => change({ query: value }, false)} disableAutoFocusFirst={Boolean(position.current.activeId)} onOpenChange={(open) => { if (!open && !composingRef.current) onClose(); }} onKeyDownCapture={(event) => {
      if (composingRef.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) {
        if (["Enter", "Escape", "ArrowDown", "ArrowUp"].includes(event.key)) event.stopPropagation();
        return;
      }
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); if (draft.filtersOpen) showFilters(false); else onClose(); return; }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); event.stopPropagation(); inputRef.current?.focus(); return; }
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); event.stopPropagation(); if (draft.filtersOpen) showFilters(false, true); else submit(); return; }
      if (event.target === inputRef.current && event.key === "Enter") {
        if (draft.filtersOpen) { event.preventDefault(); event.stopPropagation(); showFilters(false, true); }
        else if (pending || failed) { event.preventDefault(); event.stopPropagation(); }
      }
    }}>
      <CommandMenuSearch inputRef={inputRef} label={t("搜索收藏项")} placeholder={t("搜索名称、描述或关键词…")} clearLabel={t("清除搜索词")} onClear={() => { change({ query: "" }, false); inputRef.current?.focus(); }} onCompositionStart={() => { composingRef.current = true; setComposing(true); }} onCompositionEnd={(event) => { composingRef.current = false; setComposing(false); change({ query: event.currentTarget.value }, false); }} actions={<Button slot={null} variant="preset" size="sm" className="search-filter-toggle" aria-label={draft.filtersOpen ? t("取消筛选更改，返回结果") : t("打开筛选")} aria-expanded={draft.filtersOpen} aria-controls={draft.filtersOpen ? filterId : undefined} onPress={() => showFilters(!draft.filtersOpen)}><RiFilter3Line size={16} aria-hidden="true" />{t("筛选")}</Button>} />
      <div className="command-menu-body" ref={listRef} onScroll={(event) => { if (restoredScroll.current && event.target === event.currentTarget) position.current.scrollTop = event.currentTarget.scrollTop; }} aria-busy={pending}>
        {draft.filtersOpen ? <div className="search-filter-panel" id={filterId}>
          <div className="search-filter-heading"><div className="search-filter-heading-copy"><h2>{t("筛选条件")}</h2><span id={`${filterId}-help`}>{t("未限定时搜索全部字段")}</span></div><Button variant="ghost" size="sm" isDisabled={!conditions.length} onPress={reset}>{t("清空筛选")}</Button></div>
          <ToggleGroup label={t("类型")} selectedKeys={draft.scope === "all" ? [] : [draft.scope]} onSelectionChange={(keys) => change({ scope: readSearchScope(String([...keys][0] ?? "all") as SearchScope) })}>{searchScopes.filter((scope) => scope !== "all").map((scope) => <ToggleGroupItem key={scope} id={scope}>{t(scopeLabels[scope])}</ToggleGroupItem>)}</ToggleGroup>
          <ToggleGroup label={t("时间")} selectedKeys={draft.timeRange === "all" ? [] : [draft.timeRange]} onSelectionChange={(keys) => change({ timeRange: String([...keys][0] ?? "all") as SearchTimeRange })}>{searchTimeRanges.map((time) => <ToggleGroupItem key={time} id={time}>{t(searchTimeLabels[time])}</ToggleGroupItem>)}</ToggleGroup>
          {tagOptions.length ? <FacetFilter label={t("标签")} presentation="inline" options={tagOptions} selectedValues={draft.tagIds} onChange={(tagIds) => change({ tagIds })} /> : null}
          <ToggleGroup label={t("搜索字段")} aria-describedby={`${filterId}-help`} selectionMode="multiple" selectedKeys={selectedFields} onSelectionChange={(keys) => change({ fields: readSearchFields([...keys]) })}>{indexedSearchFields.map((field) => <ToggleGroupItem key={field} id={field}>{t(searchFieldLabels[field])}</ToggleGroupItem>)}</ToggleGroup>
        </div> : <>
          {conditions.length ? <section className="search-condition-summary" aria-label={t("当前搜索条件")}><p>{tf("筛选条件 {count}", { count: conditions.length })}</p><div className="search-condition-chips">{conditions.map((condition) => <Badge key={condition.id} variant="choice" removable onPress={() => { condition.remove(); requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true })); }} aria-label={tf("移除条件 {name}", { name: condition.label })}>{condition.label}</Badge>)}</div></section> : null}
          {!ready || pending || failed || showResults ? <div className="command-menu-status" role="status" aria-live="polite">{!ready ? t("正在准备本地搜索…") : pending ? t("正在更新…") : failed ? t("本地搜索暂时不可用") : tf("共 {count} 条结果 · 最多预览 8 条", { count: items.length })}</div> : null}
          {draft.fields.length === 1 && draft.fields[0] === "snapshotText" ? <p className="search-snapshot-note">{t("仅搜索已保存的正文快照")}</p> : null}
          {failed ? <div className="command-menu-empty"><p>{t("本地搜索暂时不可用")}</p><span>{t("请重试，或返回工作台继续浏览。")}</span><Button variant="secondary" size="sm" onPress={() => { if (onRetry) onRetry(); else runNow(); }}>{t("重试")}</Button></div> : <>
            {!showResults && history.length ? <section className="search-history" aria-label={t("最近搜索")}><div className="search-group-heading"><h3>{t("最近搜索")}</h3><Button variant="ghost" size="sm" onPress={() => { void clearHistory(); }}>{t("清空最近搜索")}</Button></div>{history.slice(0, 3).map((entry) => <Button key={JSON.stringify([entry.query, entry.scope, entry.fields, entry.tagIds, entry.timeRange])} variant="ghost" className="search-history-entry" onPress={() => { change({ query: entry.query, fields: entry.fields, scope: readSearchScope(entry.scope), tagIds: entry.tagIds, timeRange: entry.timeRange ?? "all", savedViewId: null }); inputRef.current?.focus(); }}><RiHistoryLine size={16} aria-hidden="true" /><span><strong>{entry.query || t("筛选收藏")}</strong><small>{[t(scopeLabels[entry.scope]), ...(entry.timeRange && entry.timeRange !== "all" ? [t(searchTimeLabels[entry.timeRange])] : []), ...entry.fields.filter((field) => field !== "all").map((field) => t(searchFieldLabels[field])), ...entry.tagIds.map(tagName)].join(" · ")}</small></span></Button>)}{historyError ? <p role="status" className="search-filter-help">{t("最近搜索未能清空，请重试。")}</p> : null}</section> : null}
            {!showResults && previewItems.length ? <h3 className="search-recent-heading">{t("最近打开")}</h3> : null}
            {!pending && !previewItems.length ? <div className="command-menu-empty"><RiSearchLine size={28} aria-hidden="true" /><p>{libraryEmpty ? t("还没有收藏项") : showResults ? t("没有找到匹配的收藏项") : t("开始查找收藏项")}</p><span>{showResults ? t("换一个关键词，或调整搜索范围和字段。") : t("搜索名称、描述、域名、标签或已保存的正文。")}</span>{showResults && conditions.length ? <Button variant="secondary" size="sm" onPress={reset}>{t("清空筛选")}</Button> : null}</div> : null}
          </>}
        </>}
        <CommandMenuList style={{ display: !draft.filtersOpen && previewItems.length && !failed ? undefined : "none" }} aria-label={showResults ? t("搜索结果") : t("最近打开")} items={draft.filtersOpen || failed ? [] : previewItems} dependencies={[presentations]} preferredFocusId={focusId} focusRequest={focusRequest} onActiveChange={onActiveChange} onAction={(key) => { if (!pending && !draft.filtersOpen && previewItems.some((item) => item.id === key)) { position.current.scrollTop = listRef.current?.scrollTop ?? 0; onPreview(String(key)); } }}>
          {(item) => { const presentation = presentations.get(item.id); return <CommandMenuItem id={item.id} textValue={item.title}><SiteIcon item={item} /><div className="command-menu-item-copy"><CommandMenuLabel><Highlight text={item.title} terms={presentation?.titleTerms ?? []} /></CommandMenuLabel><CommandMenuDescription><span className="command-menu-host">{item.siteHost}</span>{(presentation?.text || item.description) ? <span className="command-menu-excerpt">{presentation?.source === "snapshotText" ? `${t("正文")} · ` : presentation?.source === "tags" ? `${t("标签")} · ` : ""}<Highlight text={presentation?.text ?? item.description} terms={presentation?.terms ?? []} /></span> : null}</CommandMenuDescription></div><span className="command-menu-kind">{t(kindLabels[item.kind])}</span></CommandMenuItem>; }}
        </CommandMenuList>
      </div>
      {draft.filtersOpen ? <CommandMenuFooter className="search-filter-footer"><Button variant="secondary" size="sm" onPress={() => showFilters(false)} aria-keyshortcuts="Escape">{t("取消")}</Button><Button variant="contrast" size="sm" onPress={() => showFilters(false, true)} isDisabled={composing}>{t("确定")}</Button></CommandMenuFooter> : <CommandMenuFooter><div className="command-menu-hints"><span className="command-menu-navigation-hint" aria-hidden="true"><KeyboardShortcut keys={["↑"]} /><KeyboardShortcut keys={["↓"]} /><span>{t("选择")}</span></span><span className="command-menu-navigation-hint" aria-hidden="true"><KeyboardShortcut keys={["↵"]} /><span>{t("预览")}</span></span><Button variant="ghost" size="sm" className="command-menu-close" aria-label={t("取消搜索")} aria-keyshortcuts="Escape" onPress={onClose}><KeyboardShortcut keys={["Esc"]} aria-hidden="true" /><span className="command-menu-close-label">{t("关闭")}</span></Button></div><Button variant="contrast" size="sm" onPress={submit} isDisabled={!ready || composing} aria-keyshortcuts="Meta+Enter Control+Enter">{pending || failed ? t("查看全部结果") : tf("查看全部 {count} 条", { count: items.length })}<KeyboardShortcut keys={[modifier, modifier === "⌘" ? "↵" : "Enter"]} aria-hidden="true" /></Button></CommandMenuFooter>}
    </CommandMenu>
  );
}
