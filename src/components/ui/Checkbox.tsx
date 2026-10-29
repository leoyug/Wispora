import type { ComponentProps, ReactNode } from "react";
import { CheckboxButton, CheckboxField as AriaCheckboxField, CheckboxGroup as AriaCheckboxGroup, composeRenderProps, Label, Text } from "react-aria-components";
import { cn } from "@/src/lib/cn";
import { CheckboxIndicator } from "./CheckboxIndicator";

// Intent UI registry (2026-10-28): https://intentui.com/r/checkbox.json
// Preserve Group → Field → Button, controlled group values, slots and states.
// The existing tag facet's shared indicator and semantic tokens replace registry visuals.
export function CheckboxGroup({ label, description, className, children, ...props }: ComponentProps<typeof AriaCheckboxGroup> & { label: string; description?: ReactNode }) {
  return <AriaCheckboxGroup {...props} data-slot="control" className={cn("checkbox-group", typeof className === "string" && className)}>{composeRenderProps(children, (content) => <><Label>{label}</Label>{description ? <Text slot="description">{description}</Text> : null}{content}</>)}</AriaCheckboxGroup>;
}

export function CheckboxField({ className, ...props }: ComponentProps<typeof AriaCheckboxField>) {
  return <AriaCheckboxField {...props} data-slot="control" className={cn("checkbox-field", typeof className === "string" && className)} />;
}

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxButton>) {
  return <CheckboxButton {...props} className={cn("checkbox-choice", typeof className === "string" && className)}>{composeRenderProps(props.children, (children, { isSelected, isIndeterminate }) => <><CheckboxIndicator isSelected={isSelected} isIndeterminate={isIndeterminate} /><span data-slot="control-label">{children}</span></>)}</CheckboxButton>;
}
