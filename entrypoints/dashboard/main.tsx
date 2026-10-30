import React from "react";
import ReactDOM from "react-dom/client";
import "@/src/design-system/tokens.css";
import "@/src/design-system/theme.css";
import { ToastProvider } from "@/src/components/ui/Toast";
import { initializeTheme } from "@/src/lib/themePreferences";
import { initializeLanguage } from "@/src/i18n/language";
import { LocaleProvider } from "@/src/components/ui/LocaleProvider";
import { App } from "./App";

await Promise.all([initializeTheme(), initializeLanguage()]);
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><LocaleProvider><ToastProvider><App /></ToastProvider></LocaleProvider></React.StrictMode>,
);
