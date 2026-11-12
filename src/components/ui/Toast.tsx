import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Toaster, toast as sonner } from "sonner";
import { RareToastCard } from "./RareToast";
import { t } from "@/src/i18n/ui";
import { useAppLanguage } from "@/src/i18n/useLanguage";

export type ToastTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface ToastAction {
  label: string;
  onPress: () => void | Promise<void>;
}

export interface ToastOptions {
  tone?: ToastTone;
  description?: ReactNode;
  duration?: number;
  action?: ToastAction;
  isLoading?: boolean;
  shortcut?: "undo";
}

export interface ToastUpdateOptions extends Omit<ToastOptions, "description" | "action"> {
  description?: ReactNode | null;
  action?: ToastAction | null;
}

interface ToastContextValue {
  showToast: (title: ReactNode, options?: ToastOptions) => number;
  showUndoToast: (message: string, options: { subject?: string; onUndo: () => void | Promise<void> }) => number;
  updateToast: (id: number, title: ReactNode, options?: ToastUpdateOptions) => void;
  dismissToast: (id: number) => void;
  clearToasts: () => void;
}

interface ToastState extends ToastOptions {
  id: number;
  title: ReactNode;
  duration: number;
  revision: number;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const StackPausedContext = createContext(false);
const DEFAULT_TOAST_DURATION = 4000;
const ACTION_TOAST_DURATION = 7000;
let nextToastId = 0;

function toastDuration(options: ToastOptions) {
  if (options.duration !== undefined) return options.duration;
  if (options.isLoading) return 0;
  return options.action ? ACTION_TOAST_DURATION : DEFAULT_TOAST_DURATION;
}

function ManagedToast({ toast, onDismiss }: { toast: ToastState; onDismiss: (id: number) => void }) {
  const stackPaused = useContext(StackPausedContext);
  const remaining = useRef(toast.duration);
  const actionInvoked = useRef(false);

  useEffect(() => {
    remaining.current = toast.duration;
    actionInvoked.current = false;
  }, [toast.duration, toast.revision]);

  // Own lifetime so hover, keyboard focus and background tabs all preserve the
  // remaining time. Sonner owns entry, exit, measuring, swipe and stacking.
  useEffect(() => {
    if (stackPaused || toast.duration <= 0 || !Number.isFinite(toast.duration)) return;
    const started = performance.now();
    const timer = window.setTimeout(() => onDismiss(toast.id), Math.max(0, remaining.current));
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (performance.now() - started));
    };
  }, [onDismiss, stackPaused, toast.duration, toast.id, toast.revision]);

  const invokeAction = () => {
    if (!toast.action || actionInvoked.current) return;
    actionInvoked.current = true;
    onDismiss(toast.id);
    // Callers own error feedback, as in the existing Toast API.
    Promise.resolve().then(toast.action.onPress).catch(() => undefined);
  };

  return <RareToastCard id={toast.id} type={toast.isLoading ? "loading" : toast.tone ?? "neutral"} title={toast.title} description={toast.description} action={toast.action ? { label: toast.action.label, onPress: invokeAction } : undefined} shortcut={toast.shortcut} onDismiss={() => onDismiss(toast.id)} />;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  useAppLanguage();
  const toasterId = useId();
  const records = useRef(new Map<number, ToastState>());
  const viewportRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  const returnFocus = useRef<HTMLElement | null>(null);

  const forgetToast = useCallback((id: number) => {
    records.current.delete(id);
    const activeCard = document.activeElement?.closest<HTMLElement>("[data-toast-id]");
    if (Number(activeCard?.dataset.toastId) === id || (records.current.size === 0 && viewportRef.current?.contains(document.activeElement))) {
      const next = Array.from(viewportRef.current?.querySelectorAll<HTMLElement>("[data-sonner-toast][data-visible='true'] [data-toast-id]") ?? []).find((card) => records.current.has(Number(card.dataset.toastId)));
      (next ?? returnFocus.current)?.focus({ preventScroll: true });
    }
    if (records.current.size === 0) { setHovered(false); setFocused(false); }
  }, []);

  const dismissToast = useCallback((id: number) => {
    if (!records.current.has(id)) return;
    forgetToast(id);
    sonner.dismiss(id);
  }, [forgetToast]);

  const publish = useCallback((toast: ToastState) => {
    records.current.set(toast.id, toast);
    sonner.custom(() => <ManagedToast toast={toast} onDismiss={dismissToast} />, {
      id: toast.id,
      toasterId,
      duration: Infinity,
      onDismiss: () => forgetToast(toast.id),
    });
  }, [dismissToast, forgetToast, toasterId]);

  const showToast = useCallback((title: ReactNode, options: ToastOptions = {}) => {
    const id = ++nextToastId;
    publish({ ...options, id, title, duration: toastDuration(options), revision: 0 });
    return id;
  }, [publish]);

  const showUndoToast = useCallback((message: string, options: { subject?: string; onUndo: () => void | Promise<void> }) => {
    const title = <>{message}{options.subject ? <> <strong className="toast-undo-subject">“{options.subject}”</strong></> : null}</>;
    return showToast(title, { tone: "success", shortcut: "undo", action: { label: t("撤回"), onPress: options.onUndo } });
  }, [showToast]);

  const updateToast = useCallback((id: number, title: ReactNode, options: ToastUpdateOptions = {}) => {
    const current = records.current.get(id);
    // A late async result must never resurrect a notification the user dismissed.
    if (!current) return;
    const action = options.action === null ? undefined : options.action ?? current.action;
    const isLoading = options.isLoading ?? false;
    publish({ ...current, ...options, id, title, action, isLoading,
      description: options.description === null ? undefined : options.description ?? current.description,
      duration: toastDuration({ ...options, action, isLoading }), revision: current.revision + 1 });
  }, [publish]);

  const clearToasts = useCallback(() => {
    Array.from(records.current.keys()).forEach(dismissToast);
  }, [dismissToast]);

  useEffect(() => clearToasts, [clearToasts]);

  useEffect(() => {
    const handleHotkey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.shiftKey || event.repeat || event.key.toLowerCase() !== "z" || event.metaKey === event.ctrlKey) return;
      if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable], [role='textbox']")) return;
      // Sonner renders newest first; hidden/exiting notifications cannot consume undo.
      const actions = viewportRef.current?.querySelectorAll<HTMLButtonElement>("[data-sonner-toast][data-visible='true']:not([data-removed='true']) .has-undo .toast-action");
      const action = Array.from(actions ?? []).find((button) => records.current.has(Number(button.closest<HTMLElement>("[data-toast-id]")?.dataset.toastId)));
      if (!action) return;
      event.preventDefault();
      action.click();
    };
    document.addEventListener("keydown", handleHotkey);
    return () => document.removeEventListener("keydown", handleHotkey);
  }, []);

  const contextValue = useMemo(() => ({ showToast, showUndoToast, updateToast, dismissToast, clearToasts }), [clearToasts, dismissToast, showToast, showUndoToast, updateToast]);
  return <ToastContext.Provider value={contextValue}>
    {children}
    {createPortal(<StackPausedContext.Provider value={hovered || focused || hidden}>
      <div ref={viewportRef} className="toast-portal"
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        onFocusCapture={(event) => {
          if (event.relatedTarget instanceof HTMLElement && !event.currentTarget.contains(event.relatedTarget)) returnFocus.current = event.relatedTarget;
          setFocused(true);
        }}
        onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          const front = viewportRef.current?.querySelector<HTMLElement>("[data-sonner-toast][data-front='true'] [data-toast-id]");
          if (front) { event.stopPropagation(); dismissToast(Number(front.dataset.toastId)); }
        }}>
        <Toaster id={toasterId} className="toast-viewport" position="top-center" swipeDirections={["top", "left", "right"]} visibleToasts={3} gap={10} expand={focused} hotkey={["altKey", "KeyT"]}
          offset={20} mobileOffset={16} containerAriaLabel={t("通知")} customAriaLabel={t("通知")} toastOptions={{ unstyled: true, className: "toast-stack-item", duration: Infinity }} />
      </div>
    </StackPausedContext.Provider>, document.body)}
  </ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
