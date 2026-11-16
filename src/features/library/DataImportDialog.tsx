import { RiFileMarkedLine } from "@remixicon/react";
import { useEffect } from "react";
import { BookmarkImportFields } from "@/src/components/import/BookmarkImportFields";
import { useBookmarkImport } from "@/src/features/import/useBookmarkImport";
import { Dialog, FormDialogHeader, FormDialogFooter, Modal, ModalOverlay } from "@/src/components/ui/Modal";
import { t } from "@/src/i18n/ui";

interface DataImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (urls: string[], enrichMetadata: boolean) => Promise<{ added: number; skipped: number }>;
}

export function DataImportDialog({ isOpen, onClose, onImport }: DataImportDialogProps) {
  const { value, setValue, enrichMetadata, setEnrichMetadata, error, isSubmitting, submit, reset } = useBookmarkImport({ onImport, onImported: onClose });
  useEffect(() => { if (isOpen) reset(); }, [isOpen, reset]);

  return (
    <ModalOverlay className="detail-overlay" isOpen={isOpen} isDismissable={!isSubmitting} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <Modal className="form-modal import-modal">
        <Dialog className="form-dialog">
          {({ close }) => <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
            <FormDialogHeader icon={<RiFileMarkedLine size={20} />} title={t("导入浏览器书签")} description={t("导入后先保存链接，描述与标签可在后台逐步补全。")} onClose={close} closeLabel={t("关闭导入")} isDisabled={isSubmitting} />
            <div className="form-dialog-body">
              <BookmarkImportFields value={value} onChange={setValue} enrichMetadata={enrichMetadata} onEnrichChange={setEnrichMetadata} />
              {error ? <p className="form-error" role="alert">{error}</p> : null}
            </div>
            <FormDialogFooter onCancel={close} isPending={isSubmitting} submitLabel={isSubmitting ? t("正在导入…") : t("开始导入")} />
          </form>}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
