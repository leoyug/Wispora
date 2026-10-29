---
name: Wispora V0.2
description: Wispora V0.2 紧凑暖灰收藏工作台设计系统。
colorSpace: display-p3
colors:
  canvas: "color(display-p3 0.95479 0.94549 0.93104)"
  surface: "color(display-p3 1 1 1)"
  surface-secondary: "color(display-p3 0.96401 0.96091 0.95728)"
  surface-subtle: "color(display-p3 0.96401 0.96091 0.95728)"
  surface-hover: "color(display-p3 0.18039 0.18039 0.18039 / 6%)"
  surface-muted: "color(display-p3 0.90636 0.89086 0.86205)"
  border-default: "color(display-p3 0.94769 0.94143 0.93052)"
  border-subtle: "color(display-p3 0.92989 0.91439 0.89269)"
  border-strong: "color(display-p3 0.86647 0.84785 0.81899)"
  ink: "color(display-p3 0.18039 0.18039 0.18039)"
  text: "color(display-p3 0.32157 0.32157 0.32157)"
  text-muted: "color(display-p3 0.43922 0.43922 0.43922)"
  text-faint: "color(display-p3 0.55686 0.55686 0.57475)"
  copyright: "color(display-p3 0.68235 0.68235 0.69665)"
  card-border: "color(display-p3 0.89412 0.89412 0.89412)"
  media-border: "color(display-p3 0.9451 0.9451 0.9451)"
  shortcut-surface: "color(display-p3 0.94902 0.94902 0.96689)"
  scrollbar-thumb: "color(display-p3 0.87059 0.87059 0.87059)"
  scrollbar-thumb-hover: "color(display-p3 0.82353 0.82353 0.82353)"
  scrollbar-thumb-active: "color(display-p3 0.78039 0.78039 0.78039)"
  brand: "color(display-p3 1 0.4627 0.0549)"
  brand-hover: "color(display-p3 0.91 0.42106 0.04996)"
  accent: "color(display-p3 1 0.4627 0.0549)"
  accent-primary-bg: "color(display-p3 1 0.4627 0.0549 / 10%)"
  accent-primary-border: "color(display-p3 1 0.4627 0.0549 / 20%)"
  accent-soft: "color(display-p3 1 0.94627 0.90549)"
  accent-ink: "color(display-p3 0.62 0.26 0.1)"
  tag-text: "color(display-p3 1 0.4627 0.0549)"
  checkbox-mark: "color(display-p3 1 1 1)"
  search-match-text: "color(display-p3 0.62 0.26 0.1)"
  info: "color(display-p3 0.25975 0.41075 0.57373)"
  info-soft: "color(display-p3 0.90124 0.93207 0.96133)"
  success: "color(display-p3 0.27868 0.42265 0.33286)"
  success-soft: "color(display-p3 0.90271 0.93966 0.91542)"
  warning: "color(display-p3 0.51395 0.36121 0.11058)"
  warning-soft: "color(display-p3 0.95331 0.91912 0.82988)"
  danger: "color(display-p3 1 0.32157 0.32157)"
  danger-soft: "color(display-p3 0.9566 0.9005 0.88862)"
  danger-bg: "color(display-p3 1 0.32157 0.32157 / 8%)"
srgbFallbacks:
  canvas: "#f4f1ed"
  surface: "#ffffff"
  surface-secondary: "#f6f5f4"
  surface-subtle: "#f6f5f4"
  surface-hover: "rgb(46 46 46 / 6%)"
  surface-muted: "#e8e3db"
  border-default: "#f2f0ed"
  border-subtle: "#eee9e3"
  border-strong: "#ded8d0"
  ink: "#2e2e2e"
  text: "#525252"
  text-muted: "#707070"
  text-faint: "#8e8e93"
  copyright: "#aeaeb2"
  card-border: "#e4e4e4"
  media-border: "#f1f1f1"
  shortcut-surface: "#f2f2f7"
  scrollbar-thumb: "#dedede"
  scrollbar-thumb-hover: "#d2d2d2"
  scrollbar-thumb-active: "#c7c7c7"
  brand: "#ff760e"
  brand-hover: "#e96a08"
  accent-primary-bg: "rgb(255 118 14 / 10%)"
  accent-primary-border: "rgb(255 118 14 / 20%)"
  accent-soft: "#fff0e5"
  accent-ink: "#AB3A00"
  tag-text: "#FF760E"
  checkbox-mark: "#FFFFFF"
  search-match-text: "#AB3A00"
  info: "#356a96"
  info-soft: "#e4eef6"
  success: "#3b6d53"
  success-soft: "#e4f0e9"
  warning: "#8a5a00"
  warning-soft: "#f5ead1"
  danger: "#ff5252"
  danger-soft: "#f7e5e2"
  danger-bg: "rgb(255 82 82 / 8%)"
typography:
  brand:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  interface:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
  card:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "24px"
rounded:
  tag: "4px"
  small: "6px"
  control: "10px"
  card: "12px"
  media: "8px"
  pill: "48px"
  floating-menu: "22px"
components:
  button-preset:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.text}"
  button-preset-current:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
  choice-chip:
    backgroundColor: "{colors.surface-secondary}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
    height: "28px"
  choice-chip-selected:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
    height: "28px"
  badge-choice:
    backgroundColor: "{colors.surface-secondary}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
    height: "28px"
  checkbox-indicator-selected:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.checkbox-mark}"
    rounded: "{rounded.tag}"
    size: "16px"
---

# Design System: Wispora V0.2

## 视觉基准

品牌的权威来源为 [Figma「Wispora / brand-shadow」](https://www.figma.com/design/EJx5RlgQ910DaORAGylmne/Wispora?node-id=6456-52898)。组合标志使用 `790×200` 原始比例，图标为 `200×200`；字标为 Dinish Condensed Bold，使用原稿导出的轮廓 SVG，不通过系统字体近似绘制。

工作台布局的权威视觉来源是同一 Figma 文件中的 `V0.1.1 / 主页`（节点 `360:391`）。产品与技术边界仍以 `PRODUCT.md`、`TECH-STACK.md` 为准；未被新品牌稿覆盖的组件布局与交互继续遵循现有设计。

界面采用暖灰画布、纯白侧栏与纯白卡片。Wispora 的品牌主色以 `color(display-p3 1 0.4627 0.0549)` 为权威值，统一用于品牌、焦点、标签、侧栏选中态和主要操作；`#ff760e` 只是不支持 P3 时的兼容回退。卡片内容保持紧凑，封面承担主要视觉信息。

## 颜色系统

- **色域规则**：Display-P3 是唯一权威色彩空间。`src/design-system/tokens.css` 先声明 sRGB 回退，再在 `@supports (color: color(display-p3 1 1 1))` 中以同名语义 token 覆盖为 P3；支持 P3 的 Chrome/Safari 会实际渲染 P3。
- **数值展示**：设计系统预览中的色块仍使用 P3 token 渲染，但面向设计核对的色值统一显示为六位大写十六进制参考值，例如 `#FF760E`；不直接展示 P3 浮点分量。色块卡片底面使用 `surface`，名称使用 `ink`，色值说明使用 `muted`，随主题切换保持可读。
- **品牌层**：`brand / accent` 使用 P3 品牌橙，`brand-hover` 为较深状态色；`color/accent/primary-bg`（代码 token 为 `--color-accent-primary-bg`）是品牌主色 10% 透明度，用于品牌控件悬停背景；`accent-soft` 是独立的浅色选中表面，两者不互为别名。
- **表面层**：`canvas` 是页面基底；`surface` 是卡片和侧栏；`surface-secondary` 是标签等次级内容区，sRGB 核对值为 `#F6F5F4`；`surface-subtle` 用于导航选项、普通图标按钮和“取消”等弱操作文字按钮的统一悬停背景；`surface-hover` 是用于毛玻璃菜单的半透明中性交互层：浅色为深灰 6%，深色为白色 8%，保留背景透出；叠加在各主题主表面上的核对值分别为 `#F2F2F2` 与 `#2A2A2A`，当前用于添加类型菜单的悬停与键盘聚焦；`surface-muted` 是布局切换控件。
- **滚动条**：使用独立的 `scrollbar-thumb` 语义色；默认态采用更浅的中性色，悬停时微微加深，拖动时才使用当前较深的 `scrollbar-thumb-active` 色。轨道保持透明。滚动条宽 `12px`，通过 `2px` 透明内边缘形成清晰但不过重的 `8px` 可见滑块。
- **文字层**：`ink` 用于标题；`text` 用于正文；`text-muted` 用于辅助说明；`text-faint` 用于导航分组、占位文字和时间信息；`copyright` 只用于侧栏版权信息。
- **可读强调色**：`accent-ink` 用于需要清晰边界或文字对比度的强调，浅色为较深品牌橙，深色使用更鲜明、饱和的橙色 `color(display-p3 1 0.6 0.25)`，sRGB 兼容回退为 `#FF931B`。P3 权威值及 sRGB 回退集中在 `tokens.css` 与深色覆盖 `theme.css`。`search-match-text` 在代码中是它的语义别名，深色 `tag-text` 也复用该值，让选中控件、标签及搜索命中保持一致；背景仍分别由现有表面 token 决定。设计系统预览同步展示三种文字角色。
- **复选标记**：`checkbox-mark` 固定为白色，用于品牌橙实心复选框内的描边勾线或部分选中横线；深浅主题共同继承根 token，不随 `ink` 反转。按用户最新批注恢复原标签筛选外观：未选为灰色 `border-strong` 边界，选中边界与填充均为 `brand`；键盘焦点仍为 `accent-ink`。
- **搜索命中**：`search-match-text` 用于实际命中文字，配合 `accent-soft` 底色与 `600` 字重共同强调。深色主题提高文字饱和度后，P3 文字与命中底色对比度约 `6.80:1`，与选项悬停底色约 `5.50:1`；浅色继续使用深橙，文字与命中底色约 `5.69:1`。[搜索修订记录](docs/design/command-search-refinement-2026-10-28.md)保留此前版本的历史采样。
- **语义层**：成功、提示、等待、危险都使用 P3 token，并配套浅色背景 token；危险色使用鲜明的现代红，sRGB 核对值为 `#FF5252`。危险图标按钮默认保持透明，悬停时统一使用 `danger-bg`（危险红 8%）背景。禁止在组件中临时生成含义不清的状态色。
- 用色前先查本设计系统和已有语义 token，再按组件的用途与状态复用；只有已有 token 无法表达时才新增，并同步 token、设计系统文档及预览。禁止为了单个页面另写近似色。
- 新增或修改颜色必须先确定 P3 值，再提供 sRGB 兼容回退；组件只引用语义 token，不直接写颜色值或把 P3 重新转换成 sRGB 作为主值。

### 深色主题

- 参考 [Libraries.dev Beam 的暗色设计系统](https://libraries.dev/beam)（2026-09-26 核对其 `site.css`）：页面基底 `#121212`，主表面 `#181818`，次级交互层使用略亮的深灰，主要文字亮白、说明文字分级灰。只借鉴明度层级；Wispora 继续使用已确认的 P3 品牌橙，不移植 Beam 的蓝色强调色、字体或组件造型。
- 暗色语义值集中在 `src/design-system/theme.css`，先给 sRGB 回退，再在 `@supports (color: color(display-p3 1 1 1))` 内提供同名 P3 权威值。关键核对值：`canvas #121212`、`surface #181818`、`surface-secondary #202020`、`surface-subtle #262626`、`border-subtle #303030`、`ink #F5F5F5`、`text #DEDEDE`、`muted #B1B1B1`。状态色在暗背景下提亮，柔和状态底色压暗；标签文字改用高对比橙，主按钮仍使用原品牌橙。
- `html[data-theme]` 控制语义 token 和浏览器 `color-scheme`；外观设置提供“系统 / 浅色 / 深色”三选一，选择保存在 `chrome.storage.local`。未设置时默认跟随系统，并实时响应 `prefers-color-scheme` 变化。工作台、设置与设计系统预览共用当前主题；快速收藏浮层固定使用浅色，避免受当前网页或系统主题影响。开发预览的色值标签随实际主题切换。
- 主题选择区参考 [Adi 的 Theme switcher 视频](https://x.com/AdityaSur11/status/2103024134607282215/video/1)，仅借鉴切换区：三张并排的微型工作台缩略图按“跟随系统 / 深色 / 浅色”排列，每张卡下方显示对应名称。“跟随系统”示意图固定为左半暗色、右半浅色，两半分别使用完整的暗色与浅色预览并在卡片正中对齐；实际选择“跟随系统”时，界面仍随设备外观切换。手动选择的浅色、深色预览分别固定显示对应外观。缩略图在所有屏幕宽度下保持 1.6:1 宽高比，并随可用宽度等比缩放。浅色和系统缩略图用略高对比的边框，并使内部浅色底面与页面背景有轻微色差。选中卡用当前主题的 `ink` 细描边，键盘焦点仍使用品牌橙焦点环；不引入视频中的弹窗标题、关闭按钮或保存按钮。预览中的中间灰（如 `#5A5A5A`）只用于静态示意，不是应用语义色。
- 外观设置中的“界面语言”位于主题选择下方，按“跟随系统 / 中文 / English”排列为三张等宽文字选项卡。选项文字与本组标题使用相同的界面字体、字号和字重。主题与语言选项组都铺满设置内容区，三列边界和间距对齐。复用共享 Radio Group；默认用 `surface` 与 `border-strong`，选中态使用 `accent-soft` 背景、品牌橙文字与描边，键盘焦点另有品牌橙焦点环。窄屏保持清晰的点击目标。切换仅更新界面文案，不改变已保存内容。

## 布局

- 桌面侧栏默认宽度 `220px`，可通过右侧拖拽在 `176–320px` 之间调整；松开时接近默认宽度 `±20px` 会吸附回 `220px`。侧栏保持白底，右侧使用 `border-subtle #eee9e3` 细分隔线。导航滚动条紧贴侧栏右边缘，位置随共享侧栏留白 token 计算，首页与设置页共用此规则。
- 侧栏使用高 `30px` 的 Wispora 原稿组合标志（图标与字标等比缩放）；折叠时只显示 `30×30px` 原稿图标；普通导航文字为 `14px`，未选中导航图标使用比文字浅一级的 `muted` 色；选中项使用中性灰背景和深灰文字、图标，不使用品牌色。手动最小化或窄屏折叠时，侧栏宽度为 `64px`，两侧外侧留白统一为 `10px`，导航选项宽 `44px`，通过收窄选项内部图标两侧空间减少背景宽度；品牌图标仍为 `30px`，文字隐藏。
- 主内容左右内边距 `12px`；顶部导航高 `76px`，筛选栏从 `102px` 开始。
- 搜索入口宽 `560px`、高 `52px`、胶囊圆角，使用 `surface` 表面；复用共享 `SearchTrigger`，以按钮语义打开面板。生效关键词与非交互的“筛选 N”提示同时可见，N 计所选精确标签、非全部字段选项及一个非默认时间条件，不计侧栏范围或关键词；窄屏优先省略关键词并隐藏快捷键提示，不隐藏条件数。
- 搜索面板沿用 Intent UI Command Menu 的 Modal、Dialog、Autocomplete、SearchField 和 Menu 结构，UI 原语收口在 `src/components/ui/CommandMenu.tsx`。以 Figma `6527:69 / 6534:96 / 6536:224` 的布局与层级为基础，并按用户反馈图细化。桌面宽 `708px`，`1px border-subtle` 灰色外框；距顶部 `clamp(64px, 12dvh, 128px)`。共享 `CommandMenu` 提供 `heightMode`：默认记录页与筛选页使用 stable，统一固定为 `480px` 默认高度；短窗口按当前视口上限收缩，两态仍同高，超出内容在中间滚动。实际结果页使用 content，从 `480px` 下限按内容长至原最大高度。内部 Dialog 扣除上下共 `2px` 边框。固定输入栏高 `56px`，搜索图标、输入、清词与筛选按钮同列；固定底栏最小高 `64px`。“查看全部”恢复共享 sm 按钮的 `32px` 高、`0 11px` 内边距、`12px` 内容间距，文字 `14px / 400`；关闭操作保持 `36px` 高。提交内快捷键使用共享 `24px` 高、`12px` 字号、`6px` 按键间距与 `0 8px` 内边距。只有中间区域滚动。窄屏两侧留 `12px`，交互目标至少 `44px`，底栏最小高 `68px`，保留提交快捷键。
- 面板使用三个互斥内容状态：没有关键词、具体类型、时间或标签时显示最近记录；筛选页只编辑条件，不显示结果，固定底栏提供取消／确定；返回结果页后才显示可逐项移除的类型、时间、精确标签与限定字段 Badge。筛选页不重复渲染条件摘要；顶部筛选按钮再次点击或 Esc 取消本次筛选更改并返回结果，再次 Esc 取消搜索。
- 筛选页只含类型、时间、标签、搜索字段四组。共享 `ToggleGroup` 展示类型、时间和字段，标签复用 `FacetFilter` 的 `inline` 多选形式。类型为网站、文章、关注源的可取消单选，无选中即全部；时间为今天、过去 7 天、过去 30 天、今年的可取消单选，无选中即不限。时间按本地时区的收藏时间计算，过去 7 天从今天前 6 天的本地零点开始，过去 7 天与 30 天均含今天。精确标签按稳定 ID 多选且同时满足；候选及对应结果条件在此面板添加 `#` 前缀，属于用户明确授权的局部例外，不修改标签数据或其他页面。搜索内移除快捷视图组，侧栏快捷视图及原有关联逻辑保留。五个真实字段多选，未选或选满均表示全部；“未限定时搜索全部字段”紧随筛选标题，字段组通过 aria-describedby 关联该说明。
- 打开面板继承工作台的关键词、字段、时间与生效标签；全部或内容类型范围直接继承，星标或未处理范围转换为全部收藏。移除条件 Badge 只改变对应条件；“清空筛选”重置类型、时间、标签、字段与当前视图标记，保留关键词。原共享 Checkbox 的灰边、实心橙框、白色勾线与原动画继续用于工作台等其他消费者。
- 输入回显即时，查询防抖 `200ms`，输入法组合期间不执行或提交；更新中不显示旧计数且不可打开旧结果，显式提交立即执行当前草稿。关键词在任一所选字段中匹配，多个关键词必须全部匹配，可分布在字段并集中。结果预览最多 8 条，按需显示描述、正文或标签的命中片段；实际命中文字使用 `search-match-text`、`accent-soft` 表面与字重强调，正文和标签来源以文字说明。提交有关键词的搜索后默认最相关，无关键词时为最新。
- 默认页显示最多 3 条最近搜索及最多 4 条真实最近打开的收藏项；没有对应记录时不渲染分组，也不重复显示“输入关键词开始查找”。只限定字段时仍显示默认记录。最近搜索恢复关键词、类型、时间、精确标签与字段；旧星标、未处理范围记录留在存储中，但不提供面板恢复入口。先前[三态细化](docs/design/command-search-figma-2026-10-28.md)、[复选框校正](docs/design/command-search-checkbox-2026-10-28.md)、[视觉细化](docs/design/command-search-visual-2026-10-28.md)、[精确标签简化](docs/design/command-search-tag-simplification-2026-10-28.md)、[首次修订](docs/design/command-search-refinement-2026-10-28.md)和[二期验收](docs/design/command-search-phase-two-validation.md)均为历史证据；当前行为以[搜索方案](docs/design/command-search.md)为准。
- 结果行只预览详情；搜索与预览之间使用互斥受控状态，详情的“返回搜索”恢复草稿、活动结果和列表滚动。只有“查看全部结果”或 `⌘Enter / Ctrl+Enter` 一次提交范围、关键词、时间、标签与字段。当前视图的范围及标签仍与草稿一致时保留关联；手动改过范围或标签则解除关联。取消保留原条件与滚动位置。预览修改收藏数据仍正常保存，不等同于提交搜索。
- 工具栏高 `52px`。分段控件和视图切换使用 `surface-muted #e8e3db` 底色，当前项为白色。
- 工作台工具栏内的筛选、排序和筛选结果操作按钮在悬停时统一使用轻量 `toolbar-control-hover` 动效：控件位置保持不变，保留细描边并以平滑减速曲线过渡到单层、低透明度、紧凑扩散范围的柔和下投影。排列方式改为共享 `SelectMenu visual` 入口，与标签和排序使用一致的触发器反馈；`SegmentedControl` 仍供其他适合直接切换的场景使用。该状态只作用于 `.collection-toolbar`，不得复用或覆盖卡片的 `card-lift` 阴影。筛选容器允许换行且保持 `overflow: visible`，禁止裁切控件阴影。
- 工具栏左侧显示当前范围、结果数和“标签”入口；右侧显示“最新 / 最旧”排序（有关键词时另可选“最相关”）和显示当前图标及模式名称的排列下拉入口。标签与排序触发器统一复用 `toolbar-trigger` 的 `36px` 高度、Control 字号、`500` 字重、表面、描边及展开状态；展开只旋转箭头，不改变按钮位置。内容类型、处理状态与星标状态由侧栏范围表达，搜索面板只在草稿中替换同一范围值，常驻工具栏不重复设置范围入口。
- “标签”入口采用紧凑按钮并显示已选数量；点击后打开可搜索、可多选且带使用数量的浮层，搜索框固定显示“搜索标签”。搜索框与可悬停选项使用一致的 `8px` 内圆角，小于浮层的 `12px` 外圆角，以保持视觉连续。已选项在静止状态下不使用底色，只保留品牌色文字与勾选框；列表项仅在鼠标悬停或键盘可见焦点时使用次级灰色表面，鼠标点击留下的普通焦点不得持续显示底色。有筛选时，入口使用白色表面，已选数量使用品牌主色胶囊 Badge 和白色数字，避免整块按钮被品牌色占满。
- 标签筛选、排序选择和快捷视图操作菜单统一复用 `popover-surface`：白色表面、`12px` 圆角、`border-subtle` 细边框、`shadow-window` 阴影及相同的进入动效。内部可操作菜单项统一使用 `surface-subtle` 悬停背景；不同浮层只保留由内容结构决定的宽度与布局差异。
- React Aria 集合项的视觉状态必须区分 `data-hovered`、`data-focus-visible` 与内部 `data-focused`。悬停背景只响应 `data-hovered`，键盘导航背景只响应 `data-focus-visible`；不得用会在鼠标移出后继续保留的 `data-focused` 模拟 hover。
- Intent UI Toggle Group 的选中与禁用视觉分别绑定 `data-selected` 和 `data-disabled`，不得沿用原生分段按钮时期的 `aria-pressed` 或 `:disabled` 选择器；迁移交互原语时必须同步核对所有状态属性。
- 已选标签显示在工具栏下一行，不显示 `#` 前缀，每个标签都可通过 `X` 单独移除。已选标签使用白色表面、三级文字色和全圆角外形，与暖灰页面形成清楚层次；标签超过当前屏幕可用宽度时只展示部分标签，并提供“+N / 收起”按钮切换完整展示。
- 标签行右侧只显示“保存为快捷视图”和“清除全部”，不重复展示结果数量；两者与工具栏触发器统一使用 `500` 字重和较轻的次级文字色，前者使用白色次级按钮，后者使用次级灰色表面按钮。无标签筛选时不显示这一行。
- 切换任一侧栏范围时，临时标签筛选清空，排序恢复为“最新”，关键词、时间与搜索字段保留；搜索面板内切范围保留草稿关键词、时间、标签与字段。工作台的 `FacetFilter` 与 `SelectedTagBar` 继续提供精确标签组合。打开快捷视图只恢复范围与标签，侧栏调用恢复“最新”排序；关键词、时间、搜索字段、排序和排列样式均不写入快捷视图，有关键词、非默认时间或搜索字段时，保存入口注明“仅保存范围和标签”。
- 排列控件提供“详情卡片 / 紧凑卡片 / 详情列表 / 紧凑列表”四种可用模式。卡片与紧凑卡片复用 `InspirationCard` 的正式 `layout` 变体，两种列表复用 `InspirationListItem` 的 `detail` / `compact` 正式变体；切换排列保留搜索、筛选与排序，排列样式可从 URL 恢复，不写入快捷视图。排列入口显示当前图标、完整模式名称与展开箭头；展开后以 2×2 缩略示意、名称和选中勾选区分四种模式，复用共享 `SelectMenu` 的 `visual` variant。缩略示意只用于识别结构，不参与可访问名称。支持方向键、Enter 选择、Esc 关闭与焦点返回。内容区不超过 `640px` 时，当前范围与数量独占首行，标签、排序和排列按 DOM 顺序在下一行自动换行，保留文字标签；窄屏触发器最小高 `44px`。
- 卡片模式遵循 Figma「卡片组件 / 卡片」：网站显示封面、标题、描述与最多 3 个核心标签；文章不显示封面，正文区域根据实际内容自适应高度；X 帖子将作者显示在来源行，以正文首句作为标题；关注源使用 `40px` 头像突出作者。标题使用 `16px / 22px`、600 字重并最多两行，描述使用 `13px / 20px` 并最多两行。紧凑卡片沿用原横向卡片：网站封面宽 `142px`，文章使用纯文本，关注源使用 `60px` 头像；按容器宽度呈现两列或一列瀑布流。详情列表模式遵循 Figma「列表组件 / 列表 item」，不显示描述；网站仅在有真实 OG 图时显示 `128×72px` 封面，文章使用纯文本，关注源使用 `64px` 头像。
- 紧凑列表采用 `50px` 高的单行结构，只显示 `16×16px` favicon、页面标题、URL 和 `2×16px` 类型色条，不显示描述、标签、封面或星标按钮；星标仍通过右键菜单操作。favicon 距左边缘 `16px`，与标题间距 `8px`；标题使用现有系统字体栈 `font-description`、`14px / 24px`、500 字重，单行省略。标题区域与 URL 间距 `20px`；URL 右对齐，距右边缘 `24px`，使用现有 `font-metadata`、`10px / 18px`，保留路径，省略协议、开头的 `www.` 和末尾斜杠，窄屏单行省略；悬停或键盘聚焦网址时，复用共享链接的右上跳转图标淡入与位移动效。容器沿用 `12px` 卡片圆角，行间采用 `0.5px` 的 `border-default` 语义分割线；表面、文字、类型色、悬停与焦点均复用已有语义 token 及其 P3 权威值和 sRGB 回退，不引入独立色值或字体。
- 用户填写、网页自带与 AI 生成的描述在卡片和紧凑卡片中共用同一视觉位置和排版，不显示来源 Badge；列表不显示描述。描述优先级只影响内容选择，不增加卡片复杂度。内容标签默认显示纯名称，不添加 `#` 前缀；搜索候选及对应可移除条件按用户明确指示添加 `#`，不扩大至其他页面。卡片和详情列表最多显示 3 个标签，完整标签在详情和管理界面中查看。标签使用共享 Badge 的 `neutral` variant：默认态为 `surface-secondary` 背景、`text-tertiary` 文字、`border-default` 细描边和全圆角；悬停或键盘聚焦时切换为 `accent-primary-bg` 背景和 `accent-primary` 文字，并隐藏默认灰色内描边。详情列表的列表项悬停或内部控件获得焦点时，未被直接操作的标签背景切换为白色；具体标签悬停或获得键盘焦点时仍使用统一的主色交互态。点击筛选和多标签组合逻辑保持不变。
- 详情卡片网格默认显示三列，内容区宽度达到 `1200px` 时切换为四列；不足三列的视口逐级收至两列和单列。紧凑卡片保持现有列数。水平与垂直卡片间距均为 `8px`，卡片边缘、封面、信息和标签的内部间距规则保持 `8px`。
- 侧栏按“收藏库 / 内容列表 / 快捷视图”分组：收藏库包含“全部 / 未处理 / 星标”；内容列表固定为“网站 / 文章 / 关注源”；快捷视图由内容类型和标签条件组成。侧栏底部只保留“设置”，并复用 `SidebarNavItem` 的文字、间距与 `surface-subtle` 悬停状态。点击设置先在按钮上方打开锚定的 Intent UI Menu，直接提供“导入收藏 / 管理标签 / AI 助手”，具体任务再进入对应 Modal；不得用总设置 Modal 作为一级入口。V1 没有账户系统，菜单不显示头像、会员或退出登录等虚假入口。
- 添加入口固定在主内容区底部中央，水平位置随侧栏实际宽度实时更新，拖动和折叠时不增加位置过渡；窄屏图标侧栏按折叠宽度计算，侧栏改为顶部栏时回到窗口中央。主按钮为 48px 品牌橙圆形按钮；悬停、键盘聚焦或点击后，向上展开“网站 / 文章 / 关注源”三个操作，并显示文字标签。
- 卡片圆角 `12px`，边框 `0.5px #e4e4e4`，统一内边距 `8px`，内部区块间距 `8px`。
- 全项目使用协调的平滑圆角：收藏卡片（含紧凑卡片）与收藏项详情窗口使用 Lisse `0.6` 精确曲线；Chrome/Edge 其余圆角表面使用原生 `corner-shape: superellipse(1.6)`；搜索选择胶囊明确使用 `corner-shape: round`，保留半圆端部，不继承全局超椭圆。Lisse `0.6` 沿边延伸约为基础半径的 `1.6` 倍，因此支持 `corner-shape` 的浏览器把基础 CSS 半径同步放大 `1.6` 倍，避免按钮、输入框及浮层看起来比 Lisse 卡片更方；不支持时仍使用原半径的普通圆角。原生曲线使动态描边、阴影和焦点轮廓随形状绘制，避免逐控件使用 Lisse 裁切时丢失这些状态。关注源头像保持 `42%` 大圆角且随尺寸同比缩放；状态点、单选指示器、关闭按钮及添加主按钮保持正圆。卡片描边、悬停阴影、键盘焦点、瀑布流测高及详情内的标签候选浮层不得因平滑圆角失效。
- 网站卡片与详情列表的封面统一使用 `--aspect-cover: 16 / 9`（1.78:1）；真实图片和占位封面都必须由容器宽度按此比例计算高度，不得以固定高度拉伸。圆角 `8px`，细边框 `#f1f1f1`。

- 内容简报阅读页采用文章式双栏：主栏居中标题、作者与时间，虚线分隔后显示导读；宽屏主栏至多 `820px`，右侧 `260–320px` 粘性文字目录列出栏目及各收藏标题。目录使用 `surface`、`border-strong` 与 `radius-window`，当前位置沿用 `accent`；目录超高时内部滚动并跟随当前条目。窄屏目录回到正文流、默认收起，标题与正文保持系统无衬线字体；保留语义标题、键盘焦点、原文链接、相邻简报导航和现有明暗主题。往期卡片继续显示简报封面，阅读页不再以大封面占据首屏。

## 字体

- 所有界面文字统一使用 `--font-system`：`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`。中英文、数字和标点均由操作系统及浏览器按默认规则选择字体，不按 Unicode 范围拆分，不加载项目字体，也不通过 `@font-face local()` 手动绑定字重。
- `font-interface`、`font-heading`、`font-content-title`、`font-description`、`font-metadata` 与文本品牌回退 `font-brand` 仅保留语义角色，全部引用同一个系统字体 token；网址、日期、色值和快捷键也使用系统字体。占位封面文字遵循相同规则。
- 字重统一为 400（常规）、500（中等）、600（半粗）、700（粗体），由系统字体原生匹配；不使用 550、620、650 等中间值，不覆盖浏览器默认的字体合成或抗锯齿行为。
- 工作台视图标题、设置页大标题和快照阅读标题使用 600；侧栏文字统一使用 Regular（400）字重：选项为 `14px / 20px / 400`，分组标题为 `12px / 18px / 400`；选中项、数量、快捷视图（含拖动态）与底部操作均保持常规字重。字号、行高和截断规则继续按各组件已有规范执行。
- 品牌标志使用 Dinish Condensed Bold 的原稿轮廓 SVG，保留原始字距与比例；它是图像资产，不属于运行时字体。设计系统预览同步展示系统字体的中英文、数字、元数据和 400 / 500 / 600 / 700 四档字重。
- 搜索与界面说明为 14–15px；域名 10px，卡片内容 14px/24px。
- 搜索面板输入使用 `font-interface`、`16px / 20px / 500`。筛选标题用语义 h2，`12px / 600 / ink`；四组组名为 `12px / 400 / text`，紧随标题的字段说明为 `12px / 400 / muted`。清空筛选与标题同为 `12px`，使用常规字重和 muted。选项与可移除条件 Badge 统一为 `13px / 20px / 400`；条件数量和结果统计为 `12px / 400 / muted`。筛选组间距 `20px`，桌面左右留白 `20px`。结果标题为 `16px / 22px / 500`，片段为 `14px / 20px / 400`，域名及类型为 `12px`。统计区上内边距为 `12px`。
- 工作台搜索入口和结果描述使用 `font-description` 系统字体栈；面板输入、结果标题、域名与控件使用同一系统字体。占位文案末尾使用单个“…”省略号。
- 搜索入口悬停仅加深描边与图标，按下使用次级表面且保持位置；键盘聚焦使用单层 `2px` 品牌色内描边，不叠加输入框或外部焦点环。所有颜色沿用语义 token，过渡沿用控件时长并遵循减少动态效果设置。
- 快捷键提示统一复用基于 Intent UI Keyboard 的 `KeyboardShortcut`：高度 `24px`、字号 `12px`、左右留白 `8px`、按键间距 `6px`，使用 `shortcut-surface` 表面、`text` 文字与界面字体。搜索提交按钮内同样使用共享尺寸；提示本身不承担点击区域，交互由外层 Button 提供。
- 搜索面板底栏左侧依次展示 `↑` / `↓` 选择、`↵` 预览与 `Esc` 关闭，各按键复用 `KeyboardShortcut`；Esc 关闭仅在底栏出现且可点击，顶部 X 只清除关键词。窄屏收起导航说明，保留左侧 Esc 与右侧提交。结果列表只以 React Aria 当前活动项显示背景，上下键与实际鼠标移动更新同一活动项，鼠标停留位置不得与键盘活动项同时高亮。
- 从搜索预览进入详情时，头部“返回搜索”使用按内容宽度分配的列，文字保持单行；与“打开原网页”共用 `Button` 的 `sm` 尺寸、字号、字重、圆角、内边距、图标尺寸与间距，返回使用 `ghost` 变体，静止时无边框或描边阴影。所有宽度下均不添加 Tooltip。域名可省略以让出空间；宽度不超过 `480px` 时返回操作只显示箭头，保留完整可访问名称，两侧操作统一为 `44px` 点击高度。
- 字号 token：Caption 11px、Label 12px、Control 13px、Body 14px、Title 16px、Heading 24px。正文默认使用 `text`，只有标题和关键数字使用 `ink`。

## 图标与图片

- 通用界面图标统一使用 `@remixicon/react`，默认选用 `Line` 版本；选中/收藏状态可使用 `Fill` 版本。
- 工作台侧栏使用 Figma `V0.1.1` 导出的原始 16px SVG，并通过共享 `SidebarIcon` 蒙版继承当前文字颜色，以保证设计稿轮廓与选中态颜色同时准确。
- 应用品牌统一复用 `BrandLogo`：`public/assets/logo.svg` 为图标，`wordmark.svg` 为独立字标，`brand-lockup.svg` 为完整组合标志。三个 SVG 均为指定节点的原始导出，保留 P3 声明与根尺寸；扩展 `public/icon/{16,32,48,128}.png` 直接由同一图标节点按目标尺寸导出 sRGB PNG，不简化或重绘小尺寸形状。关于页使用原图标与轮廓字标，采集浮层通过扩展资源地址使用完整组合标志。
- 不使用 Unicode、emoji 或临时手绘 SVG 代替界面图标。
- 卡片站点图标与内容封面属于收藏内容，不属于通用图标系统。来源行的 favicon 以原始图片或 SVG 形状显示在 `16×16px` 区域，不统一加圆角、边框、内边距或阴影。关注源头像在卡片、紧凑卡片、详情列表中分别为 `40px`、`60px`、`64px`，统一使用一圈浅色细边框与近圆形大圆角，边框内的留白随尺寸由 `2px` 增至 `3px`；图片不叠加第二圈白边或阴影。站点图标优先使用页面声明并采集保存的 favicon；缺失或加载失败时尝试站点根目录 `/favicon.ico`，仍失败则显示 Remix Icon 通用网站占位，不允许留下空白。采集时仅对已授权同域、可解码的图标做本地像素分析：浅色透明标志自动使用深色底，其他图片保持原样；分析失败不影响收藏。详情编辑提供“图标底色：自动 / 浅底 / 深底”的预览与人工修正，人工设置优先于自动分析。内容封面应使用设计稿导出的实际资源并保存在 `public/assets/`，或使用收藏数据中的真实资源。
- 详情编辑中的“图标底色”与其他字段保持同一阅读顺序：标题单独占一行，下方左侧为当前图标预览，右侧为底色选项及说明；窄屏时说明可以换行，但预览和选项仍保持左右对应。

## 组件规则

- Intent UI 是共享 UI 组件的权威结构来源，Wispora 仅在项目内调整视觉 token、尺寸和必要的领域组合，不重新设计同名基础控件。React Aria Components 只作为 `src/components/ui/` 内部的交互原语，页面和 feature 不直接引用。
- 页面优先组合 `src/components/ui/` 与 `src/components/inspiration/` 中的已有组件。
- `Button` 的 `contrast` variant 使用 `ink` 背景与 `surface` 文字，悬停背景使用 `text`，用于搜索等表面上的高对比提交操作；沿用共享按钮的焦点、禁用和按压状态。不得在页面内重新拼装这一外观。
- `Button` 的 `preset` variant 使用 `surface-subtle` 平静表面、`text` 常规文字，无细描边或描边阴影，字号 `14px`、字重 `400`；适用时可用 `aria-current="true"` 表达 `accent-soft / accent-ink` 当前态。搜索顶部筛选入口复用此弱操作外观，字段选择改由下述 ToggleGroup 承担。键盘可见焦点使用 `accent-ink` 的 `2px` 外框，偏移 `2px`。
- 搜索选择胶囊来自 Intent UI registry 适配的共享 `ToggleGroup / ToggleGroupItem`，可移除条件复用新增的 `Badge choice` variant；两者共用同一 choice-chip 几何；筛选面板的控件使用主色选中态，结果页可移除条件保持中性灰色。默认使用 `surface-secondary / muted` 和 `0.5px border-default` 内描边；筛选面板编辑控件在深浅主题选中时使用 `accent-soft / accent-ink`，与页头当前“筛选”按钮的 preset 配色一致，不保留默认描边、边框或阴影。选中后悬停使用 `tag-surface-hover / accent-ink`；仅键盘可见焦点保留 `2px accent-ink` 外框、偏移 `2px`。胶囊使用 `radius-pill`、显式 `corner-shape: round`、`28px` 最小高与 `4px 12px` 内边距，选项与已选条件间距统一 `12px`，窄屏最小高 `44px`，文字 `13px / 20px / 400`。标签候选复用共享 ScrollArea 的原生滚动视口，隐藏原生横向滚动条，以 4px DOM 滑块呈现；指针轨道高 12px，并稳定预留 8px 空间。模块悬停、键盘可见焦点或拖动时显示 scrollbar-thumb，闲置不绘制，无悬停布局位移；悬停和拖动分别复用 scrollbar-thumb-hover／active。触控板、触屏与键盘仍滚动原生视口。设计系统预览同步展示单选、多选、可移除中性 Badge 及禁用状态；sidecar 补充通用横向 ScrollArea 外观示例。
- 搜索编辑控件状态与 token 映射：默认＝`surface-secondary / muted`＋`0.5px border-default`；未选悬停＝`surface-subtle / text`；选中＝`accent-soft / accent-ink`、无内描边；选中悬停＝`tag-surface-hover / accent-ink`；键盘焦点＝额外 `2px accent-ink` 外框、偏移 `2px`，不替换当前表面。内容卡片标签的悬停仍用 `accent-primary-bg` 等既有标签 token，不能将它等同于搜索控件的选中状态。
- 结果页 `Badge choice` 使用中性 `surface-secondary / muted` 和 `0.5px border-default`，不带编辑控件的选中状态；胶囊悬停使用 `surface-subtle / text`。删除图标放在 `16px` 圆形视觉区内，Remix Close 图标仍为 `13px`；悬停图标或键盘聚焦胶囊时使用 `surface-muted / ink`，按下时下移 `1px`。胶囊仍为单个原生移除按钮，没有嵌套按钮；Enter／Space、移除范围及输入回焦不变。尺寸与间距沿用共享 choice 几何，筛选面板的主色选中态保留。
- 可通过 `props`、`variant`、`size`、`className` 扩展时不得复制组件。
- 新增视觉状态先写入语义 token 或现有组件 variant，再进入页面。
- 图标按钮必须有可访问名称，卡片支持键盘聚焦和 Enter 打开。
- 全局成功、信息、警告、错误与等待状态分别统一使用绿、蓝、橙、红、黄五组语义 token，状态文字与反馈表面共用同一套色彩，不在组件内创建近似状态色。所有 Toast 统一由共享 `Toast` 组件渲染：固定在工作台顶部居中，使用无图标的白色胶囊、宽扩散阴影与按内容收缩的宽度；仅有标题时保持单行并在过长时省略，有描述时才展开为双行信息卡，与是否包含操作按钮无关。成功 Toast 的标题无论是否带描述都使用 `ink` 黑色文字 token；信息、警告和错误 Toast 分别保持蓝、橙、红语义色，中性通知使用次级灰。可撤回通知在次级灰操作文字后显示深灰收藏项名称。所有 Toast 的操作按钮均使用 `ink` 深色胶囊，可撤回按钮额外显示当前平台的 `⌘Z` 或 `Ctrl+Z`，快捷键在文本输入时保留原生撤销行为。自动消失的通知不常驻显示关闭按钮，持续型 loading 必须保留关闭入口。通知最多同时显示两条，其余排队；默认通知显示 4 秒，带操作通知显示 7 秒，悬停、键盘聚焦或页面进入后台时暂停计时；`Alt+T` 可将焦点移入通知区域，`Escape` 关闭当前通知，`prefers-reduced-motion` 下取消位移、缩放与模糊过渡。
- 二元启用状态统一复用从 Intent UI registry 复制并定制的共享 `Switch`，不得用 checkbox 或 radio 的外观代替；必须选择一个值的互斥表单选项复用 Intent UI `RadioGroup`，搜索中可取消的类型与时间选择复用 `ToggleGroup` 单选。共享控件覆盖选中、未选、键盘焦点与禁用状态，并只引用语义 token。
- 需要复选框形态的多项独立选择复用共享 `CheckboxGroup / CheckboxField / Checkbox`，保留当前 Intent UI registry 的 Group → Field → Button 分层、slot 与受控值；搜索字段改用 ToggleGroup 多选。`Checkbox` 与工作台 `FacetFilter` 默认浮层形式共用 `CheckboxIndicator`，从既有标签筛选提取原有勾线路径、`16px` 形状与 `radius-tag` 圆角；行背景、布局与数量仍由各组件负责。未选边界使用 `border-strong`、背景使用 `surface`；选中与部分选中边界和实心背景均使用 `brand`，勾选或横线使用固定白色 `checkbox-mark`。保留既有描边勾线动画：盒面 `150ms`、绘制 `350ms`、零延迟、取消勾选 `150ms`，曲线 `cubic-bezier(.22,1,.36,1)`；reduced-motion 下取消过渡。键盘可见焦点使用 `accent-ink` 的 `2px` 外框，偏移 `2px`；错误态使用 `danger`。设计系统预览覆盖受控多选、原生部分选中、禁用与错误状态及 `checkbox-mark` 色块，搜索胶囊另行展示。
- 当前复选外观以用户明确指定的灰边、实心橙框与白色勾线为准，不沿用此前深色勾线或高对比选中边界的方向，也不声明白色勾线满足 `3:1`。当前截图及保留原动画的验证见[复选框校正记录](docs/design/command-search-checkbox-2026-10-28.md)；此前 `6.22:1` 等颜色采样只保留为[视觉细化记录](docs/design/command-search-visual-2026-10-28.md)中的历史事实。
- 可滚动的表单与设置 Modal 统一冻结顶部标题栏；存在提交操作时同时冻结底部按钮栏，只有中间正文滚动。标题、说明、关闭按钮、取消与主操作始终可见；固定栏使用 `surface` 实色表面和分隔线，避免滚动内容从其下方透出。没有提交操作的设置列表和标签管理不添加空底栏。
- 设置中的“备份与恢复”使用独立任务分区，清楚区分下载备份与合并恢复。选择文件后先显示项目、快照和标签数量，再由用户明确确认写入；恢复不删除或覆盖现有收藏，结果原位反馈，并提示备份包含私人内容但不包含 API Key。
- AI Provider 设置在 API Key 后提供“测试连接”次级操作。测试使用当前表单中的 Provider、Endpoint、Model 与新输入或已保存的 Key 发出最小请求；成功和失败均原位反馈，测试不保存表单、不写入 Key，也不触发收藏项整理任务。
- 设置页仅在用户切换左侧功能项后，让右侧内容区整体执行 Cube Motion `rise`；初次进入设置页不播放。收藏项详情保留 React Aria Modal 原有开关与焦点行为，仅在详情内部滚动区对封面、标题、标签和后续信息块执行 Cube Motion `reveal`；编辑表单不执行 reveal，以免影响自动聚焦。两处动效都遵循 `prefers-reduced-motion`，不将动效应用到侧栏或弹窗遮罩。
- 液态形变只用于添加入口，使用 `liquid-gooey` 保持真实 DOM 按钮；三个操作在收起时不得进入 Tab 顺序。键盘可用 Enter/Space 展开、Escape 收起，`prefers-reduced-motion` 下取消弹性位移。
- 内容标签与已生效条件通过共享 Badge 渲染，默认不显示 `#`；搜索的标签候选与对应条件按用户指示显示 `#`，候选用 FacetFilter inline，条件用 Badge choice。强调标签使用 `tag-text` 常规字重文字与 `tag-surface` 背景；卡片和详情列表中的内容标签使用 `neutral` variant，标签之间保持 `8px` 间距。侧栏选中项不使用品牌色，使用比悬停表面略深的 `sidebar-active` 中性灰背景；图标、文字保持深灰，数量使用次级灰。首页与设置页导航项统一为 `36px` 最小高度，组内选项间距为 `2px`，选项与侧栏两侧边缘的留白统一为 `10px`；分组间保持 `16px` 间距。快捷视图与底部导航复用相同选项高度，窄屏设置导航也遵循同一高度和 `2px` 间距。
- 快捷视图只预置不可编辑、不可删除、不可拖动的“稍后阅读”。用户新增的视图只记录侧栏范围与标签组合，不记录排序方式或排列样式；默认名称按“新快捷视图 1、2、3…”递增，旧的同名默认视图在数据库升级时自动补上序号。在悬停或键盘聚焦时显示更多按钮。鼠标从条目进入更多按钮时，条目的悬停背景必须持续显示。普通图标按钮（包括新增、更多、关闭、编辑、方向切换和星标）悬停时统一使用 `surface-subtle`，图标加深为 `ink`；当前选中项可保留品牌色图标，但背景仍使用 `surface-subtle`。危险图标按钮使用危险红图标和 `danger-bg` 悬停背景。快捷视图名称保持单行，溢出时以右侧透明遮罩渐隐；悬停或键盘可见聚焦时按实际溢出距离横向往返滚动，两端停留，移开后回到开头，并复用 Tooltip 显示完整名称。减少动态效果时停止滚动，保留渐隐与完整名称气泡；折叠侧栏仍隐藏名称并显示气泡。快捷视图支持行内改名、二次确认删除和拖拽排序，但管理菜单不显示拖拽说明项；系统视图始终位于首位。拖动排序参考 [Jamie Merrill 的 pinned pages 视频](https://x.com/Jamie_Merrill/status/2099719860070559859)：指针移动超过小阈值后才进入排序，拖动项跟手，越过其他项中线时即预览新顺序，邻项用快速减速位移让位，松手后落位并保存；按 Escape 或在列表外松手时恢复原顺序。排序不调用浏览器原生 HTML 拖放，避免系统拖拽图标与自绘跟手项叠加。`prefers-reduced-motion` 下邻项立即换位，不执行补间。侧栏选中项的图标、文字与数量统一使用品牌主色。
- 添加入口展开为宽 `464px`、可随窄屏收缩的半透明毛玻璃菜单，使用 `card-border` 描边并加强背景模糊。菜单标题只显示“选择添加类型”，使用 `color/text/tertiary` 与 Regular 字重；不显示额外副标题。每个操作按钮必须在同一点击区域内同时包含图标、类型名称与简短说明，并使用独立的 `surface-hover` 悬停与键盘聚焦背景，以半透明中性叠层呈现反馈，避免不透明暖灰在毛玻璃上形成突兀的色块，不把文字做成脱离按钮的悬浮标签。
- 添加表单在链接下提供“描述（可选）”多行输入，并提供可搜索已有标签、输入新标签和移除已选标签的标签控件。辅助文案说明不填写描述时会自动采用网页描述或 AI 总结，不再出现“备注”字段。同一表单中可编辑的单行输入、多行输入与标签输入默认统一使用 `surface` 白色表面；`surface-subtle` 只用于悬停、弱化或明确的不可编辑状态，不以底色区分同层级控件类型。
- 手动添加表单使用共享 `Switch` 提供默认关闭的“补全网站信息”选项。开启后只请求输入 URL 所属单一域名的临时权限。批量链接与书签导入使用同一 `Switch`，开启后由浏览器一次确认本批次的精确域名集合，不逐站弹窗。说明文字必须明确读取标题、描述、favicon 与公开 OG 封面，并在完成后撤销全部权限；授权拒绝或补全失败不得阻止收藏保存。
- 浏览器工具栏的快速收藏使用按需注入到当前网页右上角的 Shadow DOM 面板，不使用原生 Popup。标签候选列表固定出现在输入框下方，通过同一 Shadow Root 内的 Portal 越过面板边界，并以网页视口为最终边界；面板内滚动不得带动宿主网页。
- 网站卡以封面优先；文章卡片和文章列表项始终使用纯文本结构，不显示封面，采集到的 Open Graph 图只在文章详情中展示；关注源卡使用更扁的主页封面并突出头像。原列表卡片定义为“紧凑卡片”，使用两列或一列响应式瀑布流。详情列表遵循 Figma `列表组件 / 列表 item`：单列白色表面、左侧元数据距边缘 `16px`、网站封面与关注源头像距右边缘 `48px`、标题单行省略、网站真实 OG 图为 `128×72px`、关注源头像为 `64×64px`，项目之间使用 `1px` 默认语义描边色分割线。星标脱离文字和媒体布局，独立定位在每个列表项右上角；未星标按钮只在项目悬停或键盘聚焦时出现，点击后切换为常驻选中态，再次点击恢复。星标不改变内容类型。
- 卡片本身不设置最小或最大宽度，由内容网格完整填充。灵感墙采用保持 DOM 顺序的 Grid 瀑布流：根据卡片真实高度计算行跨度，不使用会改变阅读与键盘顺序的 CSS multi-column 或 dense 排列。详情卡片和紧凑卡片在悬停或键盘聚焦时统一向上移动 `2px`，并同步过渡描边与阴影；详情列表和紧凑列表保持原位。`prefers-reduced-motion` 下取消空间位移。卡片右上角不再单独显示跳转按钮，只保留星标操作。
- 内容卡片除网址外均打开详情；网址区域悬停或键盘聚焦时使用品牌色、显示清晰下划线，并在文字末尾显现主色 Remix Icon `arrow-right-up-line`。标题不作为原网页链接。
- 详情卡片、紧凑卡片、详情列表与紧凑列表统一支持右键菜单。菜单固定按“访问网页 / 复制链接；星标 / 标签 / 编辑信息；查看快照 / AI 整理；归档 / 删除”分组，使用分隔线建立层级；删除使用危险色并在执行前二次确认。所有永久删除操作统一复用 React Aria 危险操作确认弹窗，禁止使用浏览器原生 `confirm` 或行内二次点击确认。菜单贴近指针打开，并在首次测量及尺寸变化后执行完整视口碰撞检测；下方空间不足时向上移动，菜单高度超过视口时内部滚动，任何选项都不得落在屏幕外。选择“标签”直接进入详情编辑态、聚焦标签输入框并展开标签候选列表，“编辑信息”则进入普通编辑态。归档管理不占用主侧栏范围，从设置菜单进入；归档内容使用单列分隔列表，逐项显示标题、归档时间、永久删除与取消归档操作。
- 收藏项详情中的编辑在当前详情布局原位展开，不切换到独立编辑页面；编辑器可切换内容类型，保存后按新类型重新排入 AI 整理，同时遵循人工描述、人工标签优先规则。类型切换可从卡片右键菜单的“编辑信息”进入；“已处理 / 未处理”只参与侧栏筛选，不在卡片或详情中显示状态标识。
- 详情封面沿用共享封面比例：网站始终显示封面区，无图片时显示占位封面；文章仅当原网页提供封面图时显示，否则不渲染封面区；关注源保持原有图片形式，详情封面维持 `269 / 160` 原比例。
- 卡片使用 8px 内边缘留白；标题与描述内容区使用 4px 内边距，标签紧随描述并保持紧凑留白。网址、封面、信息和标签区块统一使用 8px 间距，标签之间也使用 8px 间距。
- 收藏库空状态分三类：没有未归档收藏项时提供“添加网站 / 导入收藏”；当前侧栏范围本身为空时按内容类型、星标、未处理提供对应文案，内容类型可直接添加，所有范围可返回全部收藏；范围内已有内容但搜索、时间或标签无匹配时提供“清除搜索与筛选 / 调整搜索与筛选”。清除操作保留当前范围与排列；查看全部收藏清除临时条件并切回全部。仅有归档内容也视为收藏库为空。状态先检查收藏库，再检查未附加临时条件的范围，最后判断筛选结果，避免无效的恢复按钮。清除、查看全部后滚回顶部并把焦点交回搜索入口；从 URL 恢复快捷视图时同步其范围与标签到工具栏已选标签行。空状态中的“当前范围”名称最多两行截断。
- 开发环境设计系统页面位于 `dashboard.html#design-system`，必须同步展示颜色、字体、按钮、表单、卡片和布局。

### 搜索筛选确认流程（2026-10-29）

展开搜索面板的 `1px` 外框与默认 SearchTrigger 共用 `border-subtle`。筛选页保留独立固定底栏：桌面最小高 `64px`；窄屏或短视口底栏 `68px`、按钮至少 `44px`。取消复用 Button secondary，确定复用 Button contrast；以用户截图的“取消”为准，两者统一为共享 sm：最小宽 `64px`、高 `32px`、文字 `14px / 500`、左右内边距 `11px`，按钮间距 `12px`。不采用上一轮误解为通用 md 的 `36px / 600` 方向。结果页“查看全部”沿用已确认的规格。进入筛选时保存条件检查点；确定应用到面板草稿并返回结果，不提交工作台或 URL；取消、Esc 或再次点击顶部筛选入口恢复进入前的条件与结果位置，保留当前关键词。筛选页主输入的 Enter、面板内 ⌘Enter／Ctrl+Enter 等同确定。

最近打开、最近搜索、筛选标题、条件摘要与搜索结果统计统一为 `12px / 16px / 600 / text` 小标题；中间区域统一上留白 `16px`，首个小标题距输入栏分割线 `16px`。筛选组名仍为 `12px / 400`，说明为 muted／400。筛选标题栏固定保留清空按钮，无条件时禁用；按钮围绕标题行延伸，保持桌面 `32px`、窄屏 `44px` 点击区域与左右 `11px` 内边距，不由控件高度推移标题。窄／矮视口的标题行操作使用 `0px` 焦点外偏移，保留原焦点框宽度和颜色，避免滚动视口裁掉上缘。清空只修改当前筛选草稿，仍可取消。命中高亮沿用 `search-match-text`（alias `accent-ink`）文字和 `accent-soft` 底色，无新增色值。
