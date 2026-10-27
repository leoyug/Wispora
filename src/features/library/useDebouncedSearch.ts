import { useCallback, useEffect, useRef, useState } from "react";
import type { LibraryItem } from "@/src/domain/inspiration";

export type SearchItems = (query: string) => LibraryItem[];

interface SearchSnapshot {
  query: string;
  search: SearchItems;
  items: LibraryItem[];
  failed: boolean;
}

export function useDebouncedSearch(query: string, search: SearchItems, ready: boolean, composing: boolean) {
  const [snapshot, setSnapshot] = useState<SearchSnapshot | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef({ query, search, ready, composing });
  latest.current = { query, search, ready, composing };

  const runNow = useCallback(() => {
    clearTimeout(timer.current);
    const current = latest.current;
    if (!current.ready || current.composing) return null;
    try {
      const items = current.search(current.query);
      setSnapshot({ query: current.query, search: current.search, items, failed: false });
      return items;
    } catch {
      setSnapshot({ query: current.query, search: current.search, items: [], failed: true });
      return null;
    }
  }, []);

  useEffect(() => {
    if (ready && !composing) timer.current = setTimeout(runNow, 200);
    return () => clearTimeout(timer.current);
  }, [query, search, ready, composing, runNow]);

  const pending = !ready || composing || !snapshot || snapshot.query !== query || snapshot.search !== search;
  return { items: snapshot?.items ?? [], pending, failed: !pending && Boolean(snapshot?.failed), runNow };
}
