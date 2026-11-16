import { RiDeleteBinLine, RiEditLine, RiMore2Line } from "@remixicon/react";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Menu, MenuContent, MenuItem } from "@/src/components/ui/Menu";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { Button } from "@/src/components/ui/Button";
import { Tooltip } from "@/src/components/ui/Tooltip";
import type { LibrarySavedView } from "@/src/domain/inspiration";
import { cn } from "@/src/lib/cn";
import { t, tf } from "@/src/i18n/ui";

interface SavedViewNavItemProps {
  view: LibrarySavedView;
  icon: ReactNode;
  isActive: boolean;
  onPress: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  showTooltip?: boolean;
  isReorderDragging?: boolean;
  onReorderPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
}

export function SavedViewNavItem({ view, icon, isActive, onPress, onRename, onDelete, showTooltip = false, isReorderDragging = false, onReorderPointerDown }: SavedViewNavItemProps) {
  const displayName = view.isSystem ? t(view.name) : view.name;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [draft, setDraft] = useState(view.name);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const labelTextRef = useRef<HTMLSpanElement>(null);
  const [labelOverflow, setLabelOverflow] = useState(0);

  useLayoutEffect(() => {
    const label = labelRef.current;
    const text = labelTextRef.current;
    if (!label || !text) return;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const difference = text.scrollWidth - label.clientWidth;
      setLabelOverflow(label.clientWidth > 0 && difference > 1 ? difference + 16 : 0);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(label);
    observer.observe(text);
    measure();
    void document.fonts.ready.then(measure);
    return () => { disposed = true; observer.disconnect(); };
  }, [displayName, isEditing, showTooltip]);

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  const finishEditing = () => {
    const name = draft.trim();
    if (name && name !== view.name) onRename(name);
    else setDraft(view.name);
    setIsEditing(false);
  };

  const handleEditKeys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") finishEditing();
    if (event.key === "Escape") {
      setDraft(view.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={rootRef}
      data-saved-view-id={view.id}
      data-reorderable={!view.isSystem && !isEditing ? "" : undefined}
      className={cn("nav-entry saved-view-entry", isActive && "is-active", isMenuOpen && "has-open-menu", isReorderDragging && "is-dragging")}
      onPointerDownCapture={(event) => { if (!view.isSystem && !isEditing) onReorderPointerDown?.(event); }}
      onDragStart={(event) => event.preventDefault()}
    >
      {isEditing ? (
        <div className="saved-view-editor">
          {icon}
          <input ref={inputRef} value={draft} aria-label={t("快捷视图名称")} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleEditKeys} onBlur={finishEditing} />
        </div>
      ) : (
        <Tooltip content={displayName} placement="right" offset={10} className="sidebar-tooltip-bubble saved-view-tooltip" isDisabled={isMenuOpen || isReorderDragging || (!showTooltip && labelOverflow === 0)}>
          <Button type="button" variant="ghost" onPress={onPress} className={cn("nav-item saved-view-select", isActive && "is-active")} aria-label={displayName}>
            {icon}
            <span ref={labelRef} className={cn("saved-view-label", labelOverflow > 0 && "is-overflowing")} style={{ "--saved-view-label-travel": `${-labelOverflow}px`, "--saved-view-label-duration": `${Math.max(2.4, labelOverflow / 24 + 1.2)}s` } as CSSProperties}>
              <span ref={labelTextRef} className="saved-view-label-text">{displayName}</span>
            </span>
          </Button>
        </Tooltip>
      )}

      {!view.isSystem && !isEditing ? (
        <>
          <Menu isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <Button variant="ghost" size="icon" className="saved-view-more" aria-label={tf("管理快捷视图“{name}”", { name: view.name })}><RiMore2Line size={16} aria-hidden="true" /></Button>
            <MenuContent placement="bottom end" aria-label={tf("管理{name}", { name: view.name })}>
              <MenuItem id="rename" textValue={t("编辑名称")} onAction={() => setIsEditing(true)}><RiEditLine size={15} /><span>{t("编辑名称")}</span></MenuItem>
              <MenuItem id="delete" textValue={t("删除视图")} danger onAction={() => setIsDeleteOpen(true)}><RiDeleteBinLine size={15} /><span>{t("删除视图")}</span></MenuItem>
            </MenuContent>
          </Menu>
          <ConfirmDialog isOpen={isDeleteOpen} title={t("删除视图")} description={tf("确定删除快捷视图“{name}”？收藏项会保留。", { name: view.name })} onClose={() => setIsDeleteOpen(false)} onConfirm={onDelete} />
        </>
      ) : null}
    </div>
  );
}
