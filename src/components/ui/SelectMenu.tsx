import { RiArrowDownSLine, RiCheckLine } from "@remixicon/react";
import type { ReactNode } from "react";
import { Button, ListBox, ListBoxItem, Popover, Select, SelectValue } from "react-aria-components";
import { cn } from "@/src/lib/cn";

interface SelectMenuOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  preview?: ReactNode;
}

interface SelectMenuProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<SelectMenuOption<T>>;
  onChange: (value: T) => void;
  icon?: ReactNode;
  className?: string;
  variant?: "default" | "visual";
}

export function SelectMenu<T extends string>({ label, value, options, onChange, icon, className, variant = "default" }: SelectMenuProps<T>) {
  const selected = options.find((option) => option.value === value);
  return (
    <Select className={cn("select-menu", className)} aria-label={label} selectedKey={value} onSelectionChange={(key) => key !== null && onChange(String(key) as T)}>
      <Button className="toolbar-trigger select-menu-trigger" aria-label={label}>
        {selected?.icon ?? icon}
        <SelectValue>{({ selectedText }) => selectedText}</SelectValue>
        <RiArrowDownSLine className="select-menu-chevron" size={15} aria-hidden="true" />
      </Button>
      <Popover className={cn("popover-surface select-menu-popover", variant === "visual" && "select-menu-visual")} placement="bottom end" offset={6}>
        <ListBox className="select-menu-list" items={options} layout={variant === "visual" ? "grid" : "stack"}>
          {(option) => (
            <ListBoxItem id={option.value} className="select-menu-option" textValue={option.label}>
              {variant === "visual" ? <div className="select-menu-preview" aria-hidden="true">{option.preview}</div> : null}
              <span className="select-menu-option-label">{option.label}</span>
              <RiCheckLine className="select-menu-check" size={15} aria-hidden="true" />
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </Select>
  );
}
