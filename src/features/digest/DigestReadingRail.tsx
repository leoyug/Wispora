import { useEffect, useRef, useState, type MouseEvent } from "react";
import { RiArrowDownSLine } from "@remixicon/react";
import { Button } from "@/src/components/ui/Button";
import { t } from "@/src/i18n/ui";
import { digestEntryAnchor, jumpToDigestAnchor, type DigestReadingSection } from "./readingNavigation";

interface DigestReadingRailProps {
  sections: DigestReadingSection[];
  activeSectionId: string;
  activeAnchorId: string;
  visible: boolean;
  preview?: boolean;
}

export function DigestReadingRail({ sections, activeSectionId, activeAnchorId, visible, preview = false }: DigestReadingRailProps) {
  const [expanded, setExpanded] = useState(() => preview || !window.matchMedia("(max-width: 1000px)").matches);
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const panel = panelRef.current;
    const current = panel?.querySelector('[aria-current="location"]');
    if (!expanded || !visible || !panel || !current) return;
    const panelBounds = panel.getBoundingClientRect();
    const currentBounds = current.getBoundingClientRect();
    if (currentBounds.top < panelBounds.top + 16) panel.scrollTop += currentBounds.top - panelBounds.top - 16;
    else if (currentBounds.bottom > panelBounds.bottom - 16) panel.scrollTop += currentBounds.bottom - panelBounds.bottom + 16;
  }, [activeAnchorId, expanded, visible]);
  const navigate = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    if (!preview) jumpToDigestAnchor(id);
  };

  return <aside className={`digest-reading-rail${preview ? " digest-reading-rail-preview" : ""}`} aria-label={t("本期目录")}>
    <Button variant="ghost" className="digest-reading-toggle" aria-expanded={expanded} aria-controls={preview ? "digest-preview-contents" : "digest-reader-contents"} aria-label={expanded ? t("收起目录") : t("展开目录")} onPress={() => setExpanded((value) => !value)}>
      {t("目录")}<RiArrowDownSLine size={18} aria-hidden="true" />
    </Button>
    <nav ref={panelRef} id={preview ? "digest-preview-contents" : "digest-reader-contents"} className="digest-reading-panel" aria-label={t("本期目录")} hidden={!expanded}>
      <ul>{sections.map((section) => <li className="digest-reading-group" key={section.id}>
        <a href={`#${section.id}`} className={`digest-reading-section${visible && activeSectionId === section.id ? " is-current-section" : ""}`} aria-current={visible && activeAnchorId === section.id ? "location" : undefined} onClick={(event) => navigate(event, section.id)}>{t(section.label)}</a>
        <ol>{section.entries.map((entry) => {
          const anchorId = digestEntryAnchor(section.id, entry.id);
          return <li key={entry.id}><a href={`#${anchorId}`} className="digest-reading-entry" aria-current={visible && activeAnchorId === anchorId ? "location" : undefined} onClick={(event) => navigate(event, anchorId)} title={entry.title}>{entry.title}</a></li>;
        })}</ol>
      </li>)}</ul>
    </nav>
  </aside>;
}
