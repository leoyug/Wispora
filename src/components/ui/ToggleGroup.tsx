import { createContext, useContext, useId, type ComponentProps, type ReactNode } from "react";
import { ToggleButton, ToggleButtonGroup, composeRenderProps } from "react-aria-components";
import { cn } from "@/src/lib/cn";
import { ScrollArea } from "./ScrollArea";

// Intent UI registry: https://intentui.com/r/toggle-group.json (2026-10-28).
// Preserve controlled Group → Item, selection mode/orientation context and native states.
const ToggleContext = createContext({ selectionMode: "single" as "single" | "multiple", orientation: "horizontal" as "horizontal" | "vertical" });

export function ToggleGroup({ label, description, scrollable = false, className, selectionMode = "single", orientation = "horizontal", children, ...props }: ComponentProps<typeof ToggleButtonGroup> & { label: string; description?: ReactNode; scrollable?: boolean }) {
  const id = useId();
  const describedBy = [props["aria-describedby"], description ? `${id}-help` : undefined].filter(Boolean).join(" ") || undefined;
  const group = <ToggleButtonGroup {...props} selectionMode={selectionMode} orientation={orientation} aria-labelledby={id} aria-describedby={describedBy} data-slot="control" className={composeRenderProps(className, (value) => cn("toggle-group", scrollable && "toggle-group-scroll", value))}>{children}</ToggleButtonGroup>;
  return <div className="toggle-field"><span id={id} className="toggle-field-label">{label}</span>{description ? <span id={`${id}-help`} className="toggle-field-help">{description}</span> : null}<ToggleContext.Provider value={{ selectionMode, orientation }}>{scrollable ? <ScrollArea orientation="horizontal" className="toggle-group-scroll-area">{group}</ScrollArea> : group}</ToggleContext.Provider></div>;
}

export function ToggleGroupItem({ className, ...props }: ComponentProps<typeof ToggleButton>) {
  const { selectionMode, orientation } = useContext(ToggleContext);
  return <ToggleButton {...props} data-slot="toggle-group-item" data-selection-mode={selectionMode} data-orientation={orientation} className={composeRenderProps(className, (value) => cn("choice-chip toggle-group-item", value))} />;
}
