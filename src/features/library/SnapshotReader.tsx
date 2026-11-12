import DOMPurify from "dompurify";
import { RiArrowRightUpLine, RiCheckLine, RiFileCopyLine } from "@remixicon/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getCodeLanguage } from "@/src/capture/codeLanguage";
import { getXArticleTitle, isXStatusUrl } from "@/src/capture/xArticleMetadata";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { DialogTitle } from "@/src/components/ui/Modal";
import { t } from "@/src/i18n/ui";

function prepareSnapshotHtml(html: string, url: URL, title: string, isXArticle: boolean) {
  const content = document.createElement("div");
  content.append(DOMPurify.sanitize(html, {
    RETURN_DOM_FRAGMENT: true,
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "form", "input", "button", "iframe", "object", "embed"],
    FORBID_ATTR: ["style", "srcdoc"],
  }));

  const textBefore = (element: Element) => {
    const range = document.createRange();
    range.setStart(content, 0);
    range.setEndBefore(element);
    return range.toString().trim();
  };

  let removedXHeadings = false;
  if (isXArticle) {
    const [first, second] = content.querySelectorAll("h1, h2, h3, h4, h5, h6");
    if (first && second && /^(文章|Article)$/iu.test(first.textContent.trim())
      && /^(对话|對話|Conversation)$/iu.test(second.textContent.trim())
      && textBefore(second) === first.textContent.trim()) {
      first.remove();
      second.remove();
      removedXHeadings = true;
    }
  }

  const firstHeading = content.querySelector(removedXHeadings ? "h1, h2, h3, h4, h5, h6, p" : "h1, h2, h3, h4, h5, h6");
  if (firstHeading?.textContent.trim() === title.trim() && !textBefore(firstHeading)) firstHeading.remove();

  const codeBlocks = [...content.querySelectorAll("pre")].map((pre) => {
    for (const br of pre.querySelectorAll("br")) br.replaceWith("\n");
    return { pre, language: getCodeLanguage(pre), text: pre.textContent };
  });
  for (const element of content.querySelectorAll("[class]")) element.removeAttribute("class");

  for (const link of content.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const href = link.getAttribute("href")?.trim();
    if (!href) {
      link.removeAttribute("href");
      continue;
    }
    try {
      const destination = new URL(href, url);
      if (!["http:", "https:", "mailto:", "tel:"].includes(destination.protocol)) {
        link.removeAttribute("href");
        continue;
      }
      link.href = destination.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      if (destination.hash && /^[↩↵]\uFE0F?$/u.test(link.textContent.trim())) {
        const label = document.createElement("span");
        label.className = "sr-only";
        label.textContent = link.textContent;
        const icon = document.createElement("span");
        icon.className = "snapshot-footnote-icon";
        icon.setAttribute("aria-hidden", "true");
        link.replaceChildren(label, icon);
      }
    } catch {
      link.removeAttribute("href");
    }
  }

  for (const { pre } of codeBlocks) {
    const block = document.createElement("div");
    block.className = "snapshot-code-block";
    const toolbar = document.createElement("div");
    toolbar.className = "snapshot-code-toolbar";
    pre.replaceWith(block);
    block.append(toolbar, pre);
  }

  for (const table of content.querySelectorAll("table")) {
    const wrapper = document.createElement("div");
    wrapper.className = "snapshot-table-scroll";
    table.replaceWith(wrapper);
    wrapper.append(table);
  }

  return { markup: content.innerHTML, codeBlocks: codeBlocks.map(({ language, text }) => ({ language, text })) };
}

function CodeToolbar({ language, text }: { language: string; text: string }) {
  const { showToast } = useToast();
  const [copySuccess, setCopySuccess] = useState(0);
  const CopyIcon = copySuccess ? RiCheckLine : RiFileCopyLine;

  useEffect(() => {
    if (!copySuccess) return;
    const timeout = window.setTimeout(() => setCopySuccess(0), 1600);
    return () => window.clearTimeout(timeout);
  }, [copySuccess]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess((current) => current + 1);
    } catch {
      setCopySuccess(0);
      showToast(t("复制代码失败"), { tone: "danger" });
    }
  };

  return (
    <>
      <span>{language || t("纯文本")}</span>
      <Button variant="ghost" size="icon" aria-label={t("复制代码")} onPress={() => void copyCode()}>
        <CopyIcon size={16} aria-hidden="true" />
      </Button>
      <span className="sr-only" role="status">{copySuccess ? t("代码已复制") : ""}</span>
    </>
  );
}

interface SnapshotReaderProps {
  url: string;
  title: string;
  source: string;
  status: string;
  html: string;
  isArticle: boolean;
}

export function SnapshotReader({ url, title, source, status, html, isArticle }: SnapshotReaderProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [toolbarTargets, setToolbarTargets] = useState<HTMLElement[]>([]);
  const [footnoteTargets, setFootnoteTargets] = useState<HTMLElement[]>([]);
  const { displayTitle, body } = useMemo(() => {
    const sourceUrl = new URL(url);
    const isXArticle = isArticle && isXStatusUrl(sourceUrl);
    const displayTitle = (isXArticle && getXArticleTitle(sourceUrl, title)) || title;
    return { displayTitle, body: prepareSnapshotHtml(html, sourceUrl, displayTitle, isXArticle) };
  }, [url, title, html, isArticle]);

  const markup = useMemo(() => ({ __html: body.markup }), [body.markup]);

  useLayoutEffect(() => {
    setToolbarTargets(Array.from(bodyRef.current?.querySelectorAll<HTMLElement>(".snapshot-code-toolbar") ?? []));
    setFootnoteTargets(Array.from(bodyRef.current?.querySelectorAll<HTMLElement>(".snapshot-footnote-icon") ?? []));
  }, [body.markup]);

  useEffect(() => {
    if (!body.codeBlocks.some(({ language }) => language)) return;
    const elements = Array.from(bodyRef.current?.querySelectorAll<HTMLPreElement>(".snapshot-code-block > pre") ?? []);
    const controller = new AbortController();
    void import("./snapshotHighlight").then(({ highlightSnapshotCode }) => {
      if (!controller.signal.aborted) return highlightSnapshotCode(body.codeBlocks, elements, controller.signal);
    }).catch(() => undefined);
    return () => controller.abort();
  }, [body]);

  return (
    <article className="snapshot-reader" data-detail-reveal>
      <header className="snapshot-reader-heading">
        <span>{source} · {status}</span>
        <DialogTitle>{displayTitle}</DialogTitle>
      </header>
      {body.markup ? <div ref={bodyRef} className="snapshot-content" dangerouslySetInnerHTML={markup} /> : <p className="snapshot-empty">{t("这个收藏项还没有可阅读的正文快照。")}</p>}
      {footnoteTargets.map((target, index) => createPortal(<RiArrowRightUpLine size={14} />, target, index))}
      {body.codeBlocks.map(({ language, text }, index) => {
        const target = toolbarTargets[index];
        return target ? createPortal(
          <CodeToolbar language={language} text={text} />,
          target,
          index,
        ) : null;
      })}
    </article>
  );
}
