import type { ReactNode } from "react";
import { I18nProvider } from "react-aria-components";
import { useAppLanguage } from "@/src/i18n/useLanguage";

/** Keep built-in control announcements in the same language as interface copy. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const language = useAppLanguage();
  return <I18nProvider locale={language}>{children}</I18nProvider>;
}
