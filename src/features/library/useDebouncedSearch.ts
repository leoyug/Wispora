import { useCallback, useEffect, useRef, useState } from "react";
import type { LibraryItem } from "@/src/domain/inspiration";
import type { SearchPresentation } from "@/src/search/librarySearch";

export interface SearchBatch { items: LibraryItem[]; presentations: ReadonlyMap<string, SearchPresentation> }
export type SearchItems = (query: string) => SearchBatch;

interface SearchSnapshot {
  query: string;
  search: SearchItems;
  result: SearchBatch;
  failed: boolean;
}

export function useDebouncedSearch(query: string, search: SearchItems, ready: boolean, composing: boolean, immediateKey = "") {
  const [snapshot, setSnapshot] = useState<SearchSnapshot | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef({ query, search, ready, composing });
  latest.current = { query, search, ready, composing };
  const previousKey = useRef(immediateKey);

  const runNow = useCallback(() => {
    clearTimeout(timer.current);
    const current = latest.current;
    if (!current.ready || current.composing) return null;
    try {
      const result = current.search(current.query);
      setSnapshot({ query: current.query, search: current.search, result, failed: false });
      return result;
    } catch {
      setSnapshot({ query: current.query, search: current.search, result: { items: [], presentations: new Map() }, failed: true });
      return null;
    }
  }, []);

  useEffect(() => {
    const immediate = previousKey.current !== immediateKey;
    previousKey.current = immediateKey;
    if (ready && !composing) {
      if (immediate) runNow();
      else timer.current = setTimeout(runNow, 200);
    }
    return () => clearTimeout(timer.current);
  }, [query, search, ready, composing, runNow, immediateKey]);

  const pending = !ready || composing || !snapshot || snapshot.query !== query || snapshot.search !== search;
  return { items: snapshot?.result.items ?? [], presentations: snapshot?.result.presentations ?? new Map<string, SearchPresentation>(), pending, failed: !pending && Boolean(snapshot?.failed), runNow };
}
