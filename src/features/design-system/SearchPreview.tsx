import { useCallback, useRef, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { SearchTrigger } from "@/src/components/ui/SearchTrigger";
import { inspirationItems } from "@/src/data/demo";
import { LibrarySearchDialog, type SearchPosition, type SearchDraft } from "@/src/features/library/LibrarySearchDialog";
import { useToast } from "@/src/components/ui/Toast";
import { createSearchHistoryRepository, type RecentSearch } from "@/src/search/searchHistory";
import { searchConditionCount, type LibraryQuery } from "@/src/search/searchQuery";
import { primaryModifier } from "@/src/lib/platform";
import { createSearchPresentations, createLibrarySearchIndex, queryLibraryItems } from "@/src/search/librarySearch";

const previewItems = inspirationItems.map((item, i) => ({ ...item, tagIds: item.tags, snapshotText: i === 0 ? "A saved design system reference with accessible motion examples." : "", lastOpenedAt: i < 3 ? 100 - i : undefined }));
const index = createLibrarySearchIndex(previewItems);
const previewTags = [...new Set(previewItems.flatMap((item) => item.tags))].map((name) => ({ id: name, name }));
const scenarios = [
  ["default", "默认"], ["results", "搜索结果"], ["empty", "零结果"], ["loading", "加载"], ["error", "失败"], ["long", "长内容"], ["filters", "详细筛选"], ["snapshot", "正文命中"], ["fields", "字段多选"],
] as const;
type Scenario = typeof scenarios[number][0];

export function SearchPreview() {
  const [historyRepository] = useState(() => {
    let entries: RecentSearch[] = [{ query: "design", scope: "website", fields: ["description"], tagIds: [], usedAt: 1 }];
    return createSearchHistoryRepository({ read: async () => entries, write: async (next) => { entries = next; } });
  });
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [draft, setDraft] = useState<SearchDraft>({ query: "", scope: "all", fields: ["all"], tagIds: [], timeRange: "all", savedViewId: null, filtersOpen: false, immediateRevision: 0 });
  const [applied, setApplied] = useState<LibraryQuery>({ query: "design", scope: "all", fields: ["title", "tags"], tagIds: [] });
  const position = useRef<SearchPosition>({ activeId: null, scrollTop: 0 });
  const { showToast } = useToast();
  const search = useCallback((value: string) => {
    if (scenario === "error") throw new Error("Design system search error specimen");
    if (scenario === "empty") return { items: [], presentations: new Map() };
    if (scenario === "long") return { items: [{ ...inspirationItems[0]!, title: "一个用于检查中英文长标题与换行的设计系统参考 Design System Reference With A Very Long Name", description: "用于验证窄屏、缩放与单行省略；描述保持清晰，并且不会将底部提交操作挤出面板。" }], presentations: new Map() };
    const options = { ...draft, query: value };
    const matches = queryLibraryItems(previewItems, index, { ...options, sort: "relevance" });
    return { items: matches, presentations: createSearchPresentations(matches, index, value, draft.fields) };
  }, [scenario, draft.scope, draft.fields, draft.tagIds, draft.timeRange]);
  const open = (next: Scenario) => {
    position.current = { activeId: null, scrollTop: 0 };
    setDraft({ query: next === "default" ? "" : next === "empty" ? "没有匹配的示例" : "design", scope: "all", fields: next === "snapshot" ? ["snapshotText"] : next === "fields" ? ["title", "tags"] : ["all"], tagIds: [], timeRange: "all", savedViewId: null, filtersOpen: next === "filters" || next === "fields", immediateRevision: 0 });
    setScenario(next);
  };
  const modifier = primaryModifier();
  return (
    <div className="component-stack">
      <SearchTrigger query={applied.query} placeholder="搜索收藏…" conditionLabel={searchConditionCount(applied) ? `筛选 ${searchConditionCount(applied)}` : undefined} shortcut={[modifier, "K"]} aria-label="打开搜索预览" onPress={() => open("results")} />
      <div className="component-row">{scenarios.map(([value, label]) => <Button key={value} size="sm" onPress={() => open(value)}>{label}</Button>)}</div>
      {scenario ? <LibrarySearchDialog historyRepository={historyRepository} draft={draft} onDraftChange={setDraft} onClose={() => setScenario(null)} onSubmit={(value) => { setApplied(value); setScenario(null); }} onPreview={() => showToast("这是设计系统中的结果行；完整预览往返请在工作台验证。", { tone: "info" })} search={search} ready={scenario !== "loading"} tags={previewTags} position={position} /> : null}
    </div>
  );
}
