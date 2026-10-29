import { useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type PointerEvent } from "react";
import { cn } from "@/src/lib/cn";

// Intent UI registry: https://intentui.com/r/scroll-area.json (2026-10-28).
// Keep wrapper → native viewport, orientation, overflow markers and rAF/resize tracking.
// Horizontal scrollbars use the same pointer-capture pattern as AppShell so their
// hover visibility does not depend on the operating system's overlay scrollbar.
export function ScrollArea({ orientation = "both", className, children, ...props }: ComponentPropsWithRef<"div"> & { orientation?: "vertical" | "horizontal" | "both" }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; offset: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [bar, setBar] = useState({ visible: false, width: 0, start: 0 });

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    let frame = 0;
    const update = () => {
      const maxX = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      const maxY = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
      viewport.toggleAttribute("data-has-overflow-x", orientation !== "vertical" && maxX > 1);
      viewport.toggleAttribute("data-has-overflow-y", orientation !== "horizontal" && maxY > 1);
      viewport.style.setProperty("--scroll-area-overflow-x-start", `${Math.max(0, viewport.scrollLeft)}px`);
      viewport.style.setProperty("--scroll-area-overflow-x-end", `${Math.max(0, maxX - viewport.scrollLeft)}px`);
      viewport.style.setProperty("--scroll-area-overflow-y-start", `${Math.max(0, viewport.scrollTop)}px`);
      viewport.style.setProperty("--scroll-area-overflow-y-end", `${Math.max(0, maxY - viewport.scrollTop)}px`);
      const trackWidth = viewport.parentElement?.clientWidth ?? viewport.clientWidth;
      const width = Math.min(trackWidth, Math.max(32, trackWidth * viewport.clientWidth / Math.max(1, viewport.scrollWidth)));
      const next = { visible: orientation === "horizontal" && maxX > 1, width, start: maxX > 0 ? Math.max(0, viewport.scrollLeft) / maxX * (trackWidth - width) : 0 };
      setBar((current) => current.visible === next.visible && current.width === next.width && current.start === next.start ? current : next);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport);
    if (viewport.firstElementChild) observer.observe(viewport.firstElementChild);
    viewport.addEventListener("scroll", schedule, { passive: true });
    update();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); viewport.removeEventListener("scroll", schedule); };
  }, [orientation]);

  const move = (event: PointerEvent<HTMLDivElement>, offset: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const travel = Math.max(0, bounds.width - bar.width);
    const start = Math.min(travel, Math.max(0, event.clientX - bounds.left - offset));
    viewport.scrollLeft = travel ? start / travel * (viewport.scrollWidth - viewport.clientWidth) : 0;
  };
  const stop = () => { dragRef.current = null; setDragging(false); };

  return <div {...props} className={cn("scroll-area", className)} data-orientation={orientation} data-has-overflow-x={bar.visible || undefined}>
    <div ref={viewportRef} className="scroll-area-viewport" data-slot="scroll-area-viewport">{children}</div>
    {bar.visible ? <div className="scroll-area-scrollbar" aria-hidden="true" data-dragging={dragging || undefined} onPointerDown={(event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const offset = event.target instanceof HTMLElement && event.target.classList.contains("scroll-area-thumb") ? event.clientX - event.currentTarget.getBoundingClientRect().left - bar.start : bar.width / 2;
      dragRef.current = { pointerId: event.pointerId, offset };
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      move(event, offset);
    }} onPointerMove={(event) => { if (dragRef.current?.pointerId === event.pointerId) move(event, dragRef.current.offset); }} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}>
      <div className="scroll-area-thumb" style={{ width: bar.width, transform: `translateX(${bar.start}px)` }} />
    </div> : null}
  </div>;
}
