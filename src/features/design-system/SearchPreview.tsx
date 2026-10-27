import { useCallback, useRef, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { SearchTrigger } from "@/src/components/ui/SearchTrigger";
import { inspirationItems } from "@/src/data/demo";
import { LibrarySearchDialog, type SearchPosition } from "@/src/features/library/LibrarySearchDialog";
import { useToast } from "@/src/components/ui/Toast";
import { primaryModifier } from "@/src/lib/platform";
import { createLibrarySearchIndex, queryLibraryItems } from "@/src/search/librarySearch";

const index = createLibrarySearchIndex(inspirationItems);
const scenarios = [
  ["default", "默认"], ["results", "搜索结果"], ["empty", "零结果"], ["loading", "加载"], ["error", "失败"], ["long", "长内容"],
] as const;
type Scenario = typeof scenarios[number][0];

export function SearchPreview() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("design");
  const position = useRef<SearchPosition>({ activeId: null, scrollTop: 0 });
  const { showToast } = useToast();
  const search = useCallback((value: string) => {
    if (scenario === "error") throw new Error("Design system search error specimen");
    if (scenario === "empty") return [];
    if (scenario === "long") return [{ ...inspirationItems[0]!, title: "一个用于检查中英文长标题与换行的设计系统参考 Design System Reference With A Very Long Name", description: "用于验证窄屏、缩放与单行省略；描述保持清晰，并且不会将底部提交操作挤出面板。" }];
    return queryLibraryItems(inspirationItems, index, { query: value, scope: "all", tags: [], sort: "relevance" });
  }, [scenario]);
  const open = (next: Scenario) => {
    position.current = { activeId: null, scrollTop: 0 };
    setQuery(next === "default" ? "" : next === "results" ? "design" : "示例");
    setScenario(next);
  };
  const modifier = primaryModifier();
  return (
    <div className="component-stack">
      <SearchTrigger query={applied} placeholder="搜索收藏…" conditionLabel="筛选 2" shortcut={modifier === "⌘" ? "⌘K" : "Ctrl+K"} aria-label="打开搜索预览" onPress={() => open("results")} />
      <div className="component-row">{scenarios.map(([value, label]) => <Button key={value} size="sm" onPress={() => open(value)}>{label}</Button>)}</div>
      {scenario ? <LibrarySearchDialog query={query} onQueryChange={setQuery} onClose={() => setScenario(null)} onSubmit={(value) => { setApplied(value); setScenario(null); }} onPreview={() => showToast("这是设计系统中的结果行；完整预览往返请在工作台验证。", { tone: "info" })} search={search} ready={scenario !== "loading"} scopeLabel="全部收藏" tags={scenario === "long" ? ["这是一个用于验证极长标签的示例名称 Design System"] : ["设计", "组件"]} position={position} /> : null}
    </div>
  );
}
