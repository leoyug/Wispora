import { RiSearchLine } from "@remixicon/react";
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { SiteIcon } from "@/src/components/inspiration/SiteIcon";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { CommandMenu, CommandMenuDescription, CommandMenuFooter, CommandMenuItem, CommandMenuLabel, CommandMenuList, CommandMenuSearch } from "@/src/components/ui/CommandMenu";
import { KeyboardShortcut } from "@/src/components/ui/KeyboardShortcut";
import { primaryModifier } from "@/src/lib/platform";
import { t, tf } from "@/src/i18n/ui";
import { useDebouncedSearch, type SearchItems } from "./useDebouncedSearch";

export interface SearchPosition {
  activeId: string | null;
  scrollTop: number;
}

interface LibrarySearchDialogProps {
  query: string;
  onQueryChange: (query: string) => void;
  onClose: () => void;
  onSubmit: (query: string) => void;
  onPreview: (id: string) => void;
  search: SearchItems;
  ready: boolean;
  onRetry?: () => void;
  scopeLabel: string;
  tags: readonly string[];
  position: MutableRefObject<SearchPosition>;
}

const kindLabels = { website: "网站", article: "文章", follow: "关注源" } as const;

export function LibrarySearchDialog({ query, onQueryChange, onClose, onSubmit, onPreview, search, ready, onRetry, scopeLabel, tags, position }: LibrarySearchDialogProps) {
  const [composing, setComposing] = useState(false);
  const composingRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { items, pending, failed, runNow } = useDebouncedSearch(query, search, ready, composing);
  const hasQuery = Boolean(query.trim());
  const previewItems = items.slice(0, 8);
  const focusId = previewItems.some((item) => item.id === position.current.activeId) ? position.current.activeId : previewItems[0]?.id;
  const focusRequest = `${query}:${previewItems.map((item) => item.id).join(",")}`;
  const modifier = primaryModifier();
  const onActiveChange = useCallback((id: string) => { position.current.activeId = id; }, [position]);
  const restoredScroll = useRef(false);
  const initialScroll = useRef(position.current.scrollTop);

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
  }, [pending, position]);

  const submit = () => {
    if (runNow() !== null) onSubmit(query.trim());
  };
  const changeQuery = (next: string) => {
    position.current = { activeId: null, scrollTop: 0 };
    initialScroll.current = 0;
    restoredScroll.current = false;
    onQueryChange(next);
  };

  return (
    <CommandMenu isOpen isPending={pending} aria-label={t("搜索收藏")} inputValue={query} onInputChange={changeQuery} disableAutoFocusFirst={Boolean(position.current.activeId)} onOpenChange={(open) => { if (!open && !composingRef.current) onClose(); }} onKeyDownCapture={(event) => {
      if (composingRef.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) {
        if (["Enter", "Escape", "ArrowDown", "ArrowUp"].includes(event.key)) event.stopPropagation();
        return;
      }
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); return; }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); event.stopPropagation(); inputRef.current?.focus(); return; }
      if (event.target === inputRef.current && event.key === "Enter") {
        if (event.metaKey || event.ctrlKey) { event.preventDefault(); event.stopPropagation(); submit(); }
        else if (pending || failed) { event.preventDefault(); event.stopPropagation(); }
      }
    }}>
      <CommandMenuSearch inputRef={inputRef} label={t("搜索收藏项")} placeholder={t("搜索名称、描述或关键词…")} clearLabel={t("清除搜索词")} onClear={() => { changeQuery(""); inputRef.current?.focus(); }} onCompositionStart={() => { composingRef.current = true; setComposing(true); }} onCompositionEnd={(event) => { composingRef.current = false; setComposing(false); changeQuery(event.currentTarget.value); }} />
      <div className="command-menu-context"><span>{tf("在{scope}中搜索", { scope: scopeLabel })}</span><span>{t("本地搜索")}</span></div>
      {tags.length ? <div className="command-menu-conditions" aria-label={t("当前标签条件")}>{tags.map((tag) => <Badge key={tag} variant="neutral" size="sm">{tag}</Badge>)}</div> : null}
      <div className="command-menu-body" aria-busy={pending}>
        <div className="command-menu-status" role="status" aria-live="polite">{!ready ? t("正在准备本地搜索…") : pending ? t("正在更新…") : failed ? t("本地搜索暂时不可用") : hasQuery ? tf("共 {count} 条结果 · 最多预览 8 条", { count: items.length }) : t("输入关键词开始查找")}</div>
        {failed ? <div className="command-menu-empty"><p>{t("本地搜索暂时不可用")}</p><span>{t("请重试，或返回工作台继续浏览。")}</span><Button variant="secondary" size="sm" onPress={() => { if (onRetry) onRetry(); else runNow(); }}>{t("重试")}</Button></div> : !hasQuery ? <div className="command-menu-empty"><RiSearchLine size={28} aria-hidden="true" /><p>{t("开始查找收藏项")}</p><span>{t("搜索名称、描述、域名、标签或已保存的正文。")}</span></div> : !pending && !items.length ? <div className="command-menu-empty"><RiSearchLine size={28} aria-hidden="true" /><p>{t("没有找到匹配的收藏项")}</p><span>{t("换一个关键词，或返回工作台调整范围和标签。")}</span></div> : (
          <CommandMenuList ref={listRef} aria-label={t("搜索结果")} items={previewItems} preferredFocusId={focusId} focusRequest={focusRequest} onActiveChange={onActiveChange} onScroll={(event) => { if (restoredScroll.current) position.current.scrollTop = event.currentTarget.scrollTop; }} onAction={(key) => { if (!pending && items.some((item) => item.id === key)) { position.current.scrollTop = listRef.current?.scrollTop ?? 0; onPreview(String(key)); } }}>
            {(item) => <CommandMenuItem id={item.id} textValue={item.title}>
              <SiteIcon item={item} />
              <div className="command-menu-item-copy"><CommandMenuLabel>{item.title}</CommandMenuLabel><CommandMenuDescription><span className="command-menu-host">{item.siteHost}</span>{item.description ? <span className="command-menu-excerpt">{item.description}</span> : null}</CommandMenuDescription></div>
              <span className="command-menu-kind">{t(kindLabels[item.kind])}</span>
            </CommandMenuItem>}
          </CommandMenuList>
        )}
      </div>
      <CommandMenuFooter>
        <div className="command-menu-hints">
          <span className="command-menu-navigation-hint" aria-hidden="true"><KeyboardShortcut keys={["↑"]} /><KeyboardShortcut keys={["↓"]} /><span>{t("选择")}</span></span>
          <span className="command-menu-navigation-hint" aria-hidden="true"><KeyboardShortcut keys={["↵"]} /><span>{t("预览")}</span></span>
          <Button variant="ghost" size="sm" className="command-menu-close" aria-label={t("取消搜索")} aria-keyshortcuts="Escape" onPress={onClose}><KeyboardShortcut keys={["Esc"]} aria-hidden="true" /><span className="command-menu-close-label">{t("关闭")}</span></Button>
        </div>
        <Button variant="contrast" size="sm" onPress={submit} isDisabled={!ready || composing} aria-keyshortcuts="Meta+Enter Control+Enter">{pending || failed ? t("查看全部结果") : tf("查看全部 {count} 条", { count: items.length })}<KeyboardShortcut keys={[modifier, modifier === "⌘" ? "↵" : "Enter"]} aria-hidden="true" /></Button>
      </CommandMenuFooter>
    </CommandMenu>
  );
}
