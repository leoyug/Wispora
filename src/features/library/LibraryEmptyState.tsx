import { RiBookmarkLine, RiCheckboxCircleLine, RiFolderOpenLine, RiSearchLine } from "@remixicon/react";
import type { LibraryScope } from "@/src/domain/inspiration";
import type { ReactNode } from "react";
import { Button } from "@/src/components/ui/Button";
import { t } from "@/src/i18n/ui";

export type LibraryEmptyStateKind = "library" | "scope" | "filtered" | "search-unavailable";

interface LibraryEmptyStateProps {
  kind: LibraryEmptyStateKind;
  scope: LibraryScope;
  scopeTitle: string;
  onAdd: () => void;
  onImport: () => void;
  onShowAll: () => void;
  onClear: () => void;
  onSearch: () => void;
}

export function LibraryEmptyState({ kind, scope, scopeTitle, onAdd, onImport, onShowAll, onClear, onSearch }: LibraryEmptyStateProps) {
  let title: string;
  let description: string;
  let icon: ReactNode;
  let actions: ReactNode;

  if (kind === "library") {
    title = t("建立你的第一个收藏项");
    description = t("添加网站、文章或关注源，也可以导入已有的浏览器收藏。");
    icon = <RiFolderOpenLine size={24} />;
    actions = <><Button variant="primary" onPress={onAdd}>{t("添加网站")}</Button><Button variant="secondary" onPress={onImport}>{t("导入收藏")}</Button></>;
  } else if (kind === "scope") {
    title = scope === "favorites" ? t("还没有星标收藏项") : scope === "unprocessed" ? t("没有待整理的收藏项") : t("当前范围还没有收藏项");
    description = scope === "favorites" ? t("为常用的收藏项添加星标，就能在这里快速找到。") : scope === "unprocessed" ? t("已有收藏项都补充了描述或标签，去看看其他内容吧。") : t("添加到这个范围的收藏项会显示在这里。");
    icon = scope === "favorites" ? <RiBookmarkLine size={24} /> : scope === "unprocessed" ? <RiCheckboxCircleLine size={24} /> : <RiFolderOpenLine size={24} />;
    const isContentType = scope === "website" || scope === "article" || scope === "follow";
    actions = <>{isContentType ? <Button variant="primary" onPress={onAdd}>{t(scope === "article" ? "添加文章" : scope === "follow" ? "添加关注源" : "添加网站")}</Button> : null}<Button variant="secondary" onPress={onShowAll}>{t("查看全部收藏")}</Button></>;
  } else if (kind === "search-unavailable") {
    title = t("本地搜索暂时不可用");
    description = t("请重试，或返回工作台继续浏览。");
    icon = <RiSearchLine size={24} />;
    actions = <Button variant="secondary" onPress={onClear}>{t("返回浏览")}</Button>;
  } else {
    title = t("没有匹配的内容");
    description = t("当前范围内没有符合搜索或筛选条件的收藏项。");
    icon = <RiSearchLine size={24} />;
    actions = <><Button variant="primary" onPress={onClear}>{t("清除搜索与筛选")}</Button><Button variant="secondary" onPress={onSearch}>{t("调整搜索与筛选")}</Button></>;
  }

  return (
    <section className="empty-state library-empty-state" aria-label={title}>
      <div className="empty-mark" aria-hidden="true">{icon}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {kind === "scope" || kind === "filtered" ? <span className="empty-scope">{t("当前范围")}：{scopeTitle}</span> : null}
      <div className="empty-state-actions">{actions}</div>
    </section>
  );
}
