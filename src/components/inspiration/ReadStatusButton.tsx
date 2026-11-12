import { RiBookLine, RiBookOpenFill } from "@remixicon/react";
import { Button } from "@/src/components/ui/Button";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { t } from "@/src/i18n/ui";

interface ReadStatusButtonProps {
  isRead?: boolean;
  onToggle: () => void;
  showLabel?: boolean;
}

export function ReadStatusButton({ isRead = false, onToggle, showLabel = false }: ReadStatusButtonProps) {
  const Icon = isRead ? RiBookOpenFill : RiBookLine;
  return (
    <Tooltip content={isRead ? t("标为未读") : t("标为已读")}>
      <Button
        className="read-status-button"
        variant="ghost"
        size={showLabel ? "sm" : "icon"}
        aria-label={t("已读")}
        aria-pressed={isRead}
        onPress={onToggle}
      >
        <Icon size={16} aria-hidden="true" />
        {showLabel ? <span className="detail-status-label">{isRead ? t("已读") : t("未读")}</span> : null}
      </Button>
    </Tooltip>
  );
}
