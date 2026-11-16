/**
 * Adapted from Rare UI Toast — https://rareui.com
 * Copyright (c) 2026 Swami Malode.
 * MIT + Commons Clause + Attribution; see docs/licenses/rare-ui.txt.
 * Wispora adaptation: semantic tokens, Remix icons and accessible actions.
 */
import { RiCheckLine, RiCloseLine, RiErrorWarningLine, RiInformationLine, RiLoader4Line } from "@remixicon/react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { getSvgPath } from "figma-squircle";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/src/lib/cn";
import { t } from "@/src/i18n/ui";
import { useAppLanguage } from "@/src/i18n/useLanguage";

export type RareToastType = "neutral" | "success" | "danger" | "warning" | "info" | "loading";

// Keep the upstream concentric squircle geometry: 11px tile + 10px padding.
const TILE = 36;
const TILE_RADIUS = 11;
const CARD_RADIUS = 21;
const squircle = (width: number, height: number, cornerRadius: number) => getSvgPath({ width, height, cornerRadius, cornerSmoothing: 1 });
const TILE_CLIP = `path('${squircle(TILE, TILE, TILE_RADIUS)}')`;
const INSTANT = { duration: 0 } as const;
const POP = { type: "spring", stiffness: 520, damping: 30 } as const;
const SETTLE = { type: "spring", stiffness: 320, damping: 36 } as const;
const LEAVE = { duration: 0.14, ease: "easeIn" } as const;

function ToastIcon({ type }: { type: Exclude<RareToastType, "neutral"> }) {
  const reduced = useReducedMotion() ?? false;
  const [arrivingType] = useState(type);
  const settled = type !== arrivingType;
  const Icon = type === "success" ? RiCheckLine : type === "danger" ? RiCloseLine : type === "warning" ? RiErrorWarningLine : type === "info" ? RiInformationLine : RiLoader4Line;
  return (
    <motion.span
      aria-hidden="true"
      className={cn("toast-icon", `toast-icon-${type}`)}
      style={{ width: TILE, height: TILE, clipPath: TILE_CLIP }}
      initial={reduced ? false : { scale: 0.85, opacity: 0 }}
      animate={{ scale: settled ? [1, 1.08, 1] : 1, opacity: 1 }}
      transition={reduced ? INSTANT : settled ? { scale: { duration: 0.4, delay: LEAVE.duration, ease: "easeOut", times: [0, 0.4, 1] } } : { ...SETTLE, delay: 0.24 }}
    >
      <AnimatePresence initial={!reduced} mode="wait">
        <motion.span
          key={type}
          className="toast-glyph"
          initial={reduced ? false : { scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: reduced ? 1 : 0.5, opacity: 0, transition: reduced ? INSTANT : LEAVE }}
          transition={reduced ? INSTANT : { ...POP, delay: settled ? 0 : 0.32 }}
        ><Icon size={20} className={type === "loading" ? "toast-spinner" : undefined} /></motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

// offsetWidth/Height avoid Sonner's collapsed-stack scale skewing the clip path.
function useBoxSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setSize({ width: element.offsetWidth, height: element.offsetHeight }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

export interface RareToastCardProps {
  id: number;
  type: RareToastType;
  title: ReactNode;
  description?: ReactNode;
  action?: { label: string; onPress: () => void };
  shortcut?: "undo";
  onDismiss: () => void;
}

export function RareToastCard({ id, type, title, description, action, shortcut, onDismiss }: RareToastCardProps) {
  useAppLanguage();
  const [cardRef, { width, height }] = useBoxSize();
  useLayoutEffect(() => {
    const item = cardRef.current?.closest<HTMLElement>("[data-sonner-toast]");
    if (!item) return;
    const sync = () => {
      const hidden = item.dataset.visible === "false" || item.dataset.removed === "true" || (item.dataset.front === "false" && item.dataset.expanded === "false");
      item.inert = hidden;
      item.tabIndex = hidden ? -1 : 0;
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(item, { attributes: true, attributeFilter: ["data-visible", "data-front", "data-expanded", "data-removed"] });
    return () => observer.disconnect();
  }, [cardRef]);
  const outline = width > 0 && height > 0 ? squircle(width, height, CARD_RADIUS) : undefined;
  const isApplePlatform = /Mac|iPhone|iPad/.test(navigator.platform);
  const titleId = `toast-title-${id}`;
  const descriptionId = `toast-description-${id}`;
  return (
    <div
      className={cn("toast-message", shortcut === "undo" && "has-undo")}
      style={{ borderRadius: CARD_RADIUS }}
      data-toast-id={id}
      data-tone={type}
      role={type === "danger" ? "alert" : "group"}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.stopPropagation();
        onDismiss();
      }}
    >
      <div ref={cardRef} className="toast-card" style={{ borderRadius: CARD_RADIUS, clipPath: outline ? `path('${outline}')` : undefined }}>
        {outline ? <svg className="toast-outline" width={width} height={height} aria-hidden="true"><path d={outline} fill="none" strokeWidth={2} /></svg> : null}
        <div className="toast-body">
          {type !== "neutral" ? <ToastIcon type={type} /> : null}
          <div className="toast-content">
            <p className="toast-title" id={titleId}>{title}</p>
            {description ? <p className="toast-description" id={descriptionId}>{description}</p> : null}
          </div>
          {action ? <button type="button" className="toast-action" aria-keyshortcuts={shortcut === "undo" ? (isApplePlatform ? "Meta+Z" : "Control+Z") : undefined} onClick={action.onPress}>
            {action.label}
            {shortcut === "undo" ? <span className="toast-undo-shortcut" aria-hidden="true">{isApplePlatform ? "⌘Z" : "Ctrl+Z"}</span> : null}
          </button> : null}
        </div>
      </div>
      <button type="button" className="toast-close" aria-label={t("关闭通知")} onClick={onDismiss}><RiCloseLine size={14} /></button>
    </div>
  );
}
