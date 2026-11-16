import { RiCloseLine } from "@remixicon/react";
import { Button } from "./Button";
import { t } from "@/src/i18n/ui";
import type { ComponentProps, ReactNode } from "react";
import {
  Dialog as AriaDialog,
  Heading as AriaHeading,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
} from "react-aria-components";
import { cn } from "@/src/lib/cn";

// Intent UI modal anatomy, adapted to Wispora's existing class-based tokens.
// https://intentui.com/docs/components/overlays/modal
export function ModalOverlay(props: ComponentProps<typeof AriaModalOverlay>) {
  const { className, ...rest } = props;
  return <AriaModalOverlay data-slot="modal-overlay" className={typeof className === "function" ? (values) => cn("t-modal-overlay", className(values)) : cn("t-modal-overlay", className)} {...rest} />;
}

export function Modal(props: ComponentProps<typeof AriaModal>) {
  const { className, ...rest } = props;
  return <AriaModal data-slot="modal" className={typeof className === "function" ? (values) => cn("t-modal", className(values)) : cn("t-modal", className)} {...rest} />;
}

export function Dialog(props: ComponentProps<typeof AriaDialog>) {
  return <AriaDialog data-slot="dialog" {...props} />;
}

export function DialogTitle(props: ComponentProps<typeof AriaHeading>) {
  return <AriaHeading data-slot="dialog-title" slot="title" {...props} />;
}

/** Shared fixed header and action bar; the caller owns the form and scroll body. */
export function FormDialogHeader({ title, description, icon, onClose, closeLabel, isDisabled }: { title: ReactNode; description: string; icon: ReactNode; onClose: () => void; closeLabel: string; isDisabled?: boolean }) {
  return <header className="form-dialog-header"><div className="form-dialog-icon">{icon}</div><div><DialogTitle>{title}</DialogTitle><p>{description}</p></div><Button type="button" size="icon" variant="ghost" aria-label={closeLabel} isDisabled={isDisabled} onPress={onClose}><RiCloseLine size={19} /></Button></header>;
}

export function FormDialogFooter({ onCancel, submitLabel, isPending = false }: { onCancel: () => void; submitLabel: string; isPending?: boolean }) {
  return <footer className="form-dialog-footer"><Button type="button" variant="ghost" isDisabled={isPending} onPress={onCancel}>{t("取消")}</Button><Button type="submit" variant="primary" isDisabled={isPending}>{submitLabel}</Button></footer>;
}
