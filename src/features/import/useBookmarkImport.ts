import { useCallback, useState } from "react";
import { t, tf } from "@/src/i18n/ui";

export function extractBookmarkUrls(value: string) {
  const anchors = new DOMParser().parseFromString(value, "text/html").querySelectorAll<HTMLAnchorElement>("a[href]");
  const urls = new Set<string>();
  for (const anchor of anchors) {
    try {
      const url = new URL(anchor.getAttribute("href")?.trim() ?? "");
      if (/^https?:$/.test(url.protocol)) urls.add(url.href);
    } catch { /* Ignore invalid and relative bookmark fragments. */ }
  }
  return [...urls];
}

export function useBookmarkImport<Result extends { added: number; skipped: number }>({ onImport, onImported }: { onImport: (urls: string[], enrichMetadata: boolean) => Promise<Result>; onImported: (result: Result) => void }) {
  const [value, setValue] = useState("");
  const [enrichMetadata, setEnrichMetadata] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reset = useCallback(() => { setValue(""); setEnrichMetadata(false); setError(""); setIsSubmitting(false); }, []);
  const submit = async () => {
    if (isSubmitting) return;
    const urls = extractBookmarkUrls(value);
    setError("");
    if (!urls.length) { setError(t("书签 HTML 中没有找到可导入的链接")); return; }
    setIsSubmitting(true);
    try {
      const result = await onImport(urls, enrichMetadata);
      if (!result.added) { setError(tf("没有新增内容，{count} 个链接已存在。", { count: result.skipped })); return; }
      setValue("");
      onImported(result);
    } catch { setError(t("导入未能写入本地收藏库，请重试。")); }
    finally { setIsSubmitting(false); }
  };
  return { value, setValue, enrichMetadata, setEnrichMetadata, error, isSubmitting, submit, reset };
}
