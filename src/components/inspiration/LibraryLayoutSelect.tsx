import { RiLayoutColumnLine, RiLayoutGridLine, RiListCheck, RiListUnordered } from "@remixicon/react";
import { SelectMenu } from "@/src/components/ui/SelectMenu";
import type { InspirationLayout } from "./InspirationCard";
import { t } from "@/src/i18n/ui";

export type LibraryLayoutMode = InspirationLayout | "compact-list";

const layouts = [
  { value: "cards", label: "详情卡片", Icon: RiLayoutGridLine },
  { value: "compact", label: "紧凑卡片", Icon: RiLayoutColumnLine },
  { value: "list", label: "详情列表", Icon: RiListCheck },
  { value: "compact-list", label: "紧凑列表", Icon: RiListUnordered },
] as const;

function LayoutPreview({ mode }: { mode: LibraryLayoutMode }) {
  return (
    <span className="library-layout-preview" data-layout={mode}>
      {Array.from({ length: mode === "cards" || mode === "compact" ? 4 : 3 }, (_, index) => (
        <span key={index} className="layout-preview-item">
          <span className="layout-preview-media" />
          <span className="layout-preview-copy"><i /><i /><i /></span>
        </span>
      ))}
    </span>
  );
}

export function LibraryLayoutSelect({ value, onChange }: { value: LibraryLayoutMode; onChange: (mode: LibraryLayoutMode) => void }) {
  return (
    <SelectMenu<LibraryLayoutMode>
      label={t("排列样式")}
      value={value}
      onChange={onChange}
      variant="visual"
      className="layout-switch"
      options={layouts.map(({ value: mode, label, Icon }) => ({ value: mode, label: t(label), icon: <Icon size={16} aria-hidden="true" />, preview: <LayoutPreview mode={mode} /> }))}
    />
  );
}
