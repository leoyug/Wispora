import { RiCloseLine } from "@remixicon/react";
import type { HTMLAttributes, MouseEventHandler, ReactNode } from "react";
import { cn } from "@/src/lib/cn";

interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "onClick"> {
  children: ReactNode;
  variant?: "accent" | "neutral" | "selected" | "choice";
  size?: "md" | "sm";
  onPress?: MouseEventHandler<HTMLButtonElement>;
  removable?: boolean;
}

export function Badge({ className, children, variant = "accent", size = "md", onPress, removable = false, ...props }: BadgeProps) {
  const closeIcon = <RiCloseLine size={13} aria-hidden="true" />;
  const content = <>{children}{removable && (variant === "choice" ? <span className="badge-remove-icon" aria-hidden="true">{closeIcon}</span> : closeIcon)}</>;
  const classes = cn("badge", `badge-${variant}`, `badge-${size}`, variant === "choice" && "choice-chip", className);
  if (onPress) return <button type="button" className={classes} onClick={onPress} {...props}>{content}</button>;
  return <span className={classes} {...props}>{content}</span>;
}
