import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";
import { description } from "./package.json";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Wispora",
    description,
    permissions: ["activeTab", "scripting", "storage"],
    optional_host_permissions: ["http://*/*", "https://*/*"],
    icons: {
      16: "icon/16.png",
      32: "icon/32.png",
      48: "icon/48.png",
      128: "icon/128.png",
    },
    action: {
      default_title: "打开 Wispora",
      default_icon: {
        16: "icon/16.png",
        32: "icon/32.png",
        48: "icon/48.png",
        128: "icon/128.png",
      },
    },
    web_accessible_resources: [
      {
        resources: ["assets/logo.svg", "assets/wordmark.svg", "assets/brand-lockup.svg"],
        matches: ["http://*/*", "https://*/*"],
      },
    ],
  },
  vite: () => ({ plugins: [tailwindcss()] }),
});
