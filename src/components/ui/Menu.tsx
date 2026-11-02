import type { ComponentProps, ReactNode } from "react";
import { Menu as AriaMenu, MenuItem as AriaMenuItem, MenuTrigger as AriaMenuTrigger, Popover } from "react-aria-components";
import { cn } from "@/src/lib/cn";

// Intent UI menu anatomy. Both anchored and pointer menus share items and states.
export const Menu = AriaMenuTrigger;

export function MenuSurface({ className, ...props }: ComponentProps<typeof AriaMenu>) {
  return <AriaMenu className={typeof className === "function" ? (state) => cn("menu-content", className(state)) : cn("menu-content", className)} {...props} />;
}

export function MenuContent({ children, placement = "top start", className, ...props }: Omit<ComponentProps<typeof AriaMenu>, "children"> & { children: ReactNode; placement?: ComponentProps<typeof Popover>["placement"] }) {
  return <Popover className="popover-surface menu-popover" placement={placement} offset={8}><MenuSurface className={className} {...props}>{children}</MenuSurface></Popover>;
}

export function MenuItem({ className, danger, separatorBefore, ...props }: ComponentProps<typeof AriaMenuItem> & { danger?: boolean; separatorBefore?: boolean }) {
  const classes = (value?: string) => cn("menu-item", danger && "is-danger", separatorBefore && "menu-item-separated", value);
  return <AriaMenuItem className={typeof className === "function" ? (state) => classes(className(state)) : classes(className)} {...props} />;
}
