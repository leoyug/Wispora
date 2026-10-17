# Wispora 品牌资产

2026-10-17 按用户提供的 [Figma 品牌稿](https://www.figma.com/design/EJx5RlgQ910DaORAGylmne/Wispora?node-id=6456-52898) 替换品牌。名称固定写为 **Wispora**。

| 资产 | 原始节点 | 用途 |
| --- | --- | --- |
| `public/assets/logo.svg` | `6456:52900` | 200×200 图标；侧栏折叠、关于页和 favicon |
| `public/assets/brand-lockup.svg` | `6456:52899` | 790×200 组合标志；工作台、收藏浮层与简报 |
| `public/assets/wordmark.svg` | `6456:52914` | 533×170 轮廓字标；关于页与设计系统预览 |
| `public/icon/{16,32,48,128}.png` | `6456:52900` | 从同一图标按目标尺寸直接导出的 sRGB 扩展图标 |

SVG 保留 Figma 原始路径、根尺寸和 `color(display-p3 ...)` 声明；不编辑图形、拼接字母或重新绘制小图标。字标由 Dinish Condensed Bold 转为轮廓，无需用户安装或另行提供字体文件。组合标志保留原稿的 48px 间距，通过 `BrandLogo` 等比显示。品牌橙继续使用现有语义 token：权威值 `color(display-p3 1 0.4627 0.0549)`，sRGB 回退 `#FF760E`。

新品牌稿只定义标志与名称；未提供替代稿的侧栏导航 SVG、通用 Remix 图标、内容封面和界面布局沿用现有确认资产。深色主题也使用同一原始橙色标志，不自行制作反白版。

## 已有数据兼容

数据库名称与现有 `wanderland.*` 设置键保留，避免品牌改名后出现空收藏库或丢失语言、主题、侧栏与 AI 配置。代码类名更新为 `WisporaDatabase`，不改变数据库版本或表结构。

新备份标识与文件名使用 `wispora-backup`；导入同时接受旧的 `wanderland-backup`，版本仍为 1，恢复保持合并、不覆盖已有内容。历史路线图和旧设计概念中的名称保留，表示当时的设计记录。
