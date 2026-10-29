# 搜索设置视觉细化与验证

日期：2026-10-28。版本仍为 `0.7.2`。本轮按已确认方向细化复选外观、预设状态与文字层级，沿用现有视觉系统；查询、字段控制器、最后一项防护、取消、预览与显式提交边界保持原实现。独立完整复核结论为 `ship`：持久化与视觉保真通过，八张必需捕获有效，已批准的视觉细化范围内无必须修复项。测试浏览器与开发进程已正常关闭并复查退出；本轮不替代 V1 发布验收。

## 当前规则

- `Checkbox` 和工作台 `FacetFilter` 共用从既有标签筛选提取的 `CheckboxIndicator`，保留原勾线路径、`16px` 形状和 `radius-tag` 圆角。选中／部分选中使用 `brand` 实心填充、`accent-ink` 边界和 `checkbox-mark` 深色勾线／横线；各组件继续负责自己的行背景、布局与数量。`Checkbox` 保留 Intent UI 的 Group → Field → Button 结构、slot、受控状态和可访问行为。
- 新增语义色 `--color-checkbox-mark`：P3 权威值 `color(display-p3 0.09412 0.09412 0.09412)`，sRGB 回退 `#181818`。深浅主题共同继承根值，不随主题 `ink` 反转。选中边界继续使用 `accent-ink`，满足相对主表面至少 `3:1` 的边界要求。
- 共享 `Button` 新增 `preset` variant：`surface-subtle` 平静表面，无细描边或描边阴影，`14px / 400`；精确对应当前字段集合时用 `aria-current="true"` 和 `accent-soft / accent-ink` 表达。当前按钮保持可用，重复点击幂等；自定义组合没有当前预设。它与“最后一个字段禁用”是不同状态，最后一项防护仍有效。
- 范围／字段标题为 `14px / 500 / ink`；选项为 `14px / 400 / text`；展开操作沿用带方向箭头的 ghost Button，`14px / 400`。展开态“搜索设置”为 `14px / 400 / muted`；字段辅助说明、收起字段摘要与结果统计为 `12px / 400 / muted`。收起摘要明确显示“字段：实际名称”，英文为“Fields: …”；结果统计上内边距为 `12px`。
- 设计系统预览同步展示普通／当前预设、共享复选状态与 `checkbox-mark` 色块。文档 sidecar 只新增本轮语义色元数据和复选／预设示例，不重建旧世界。

## 本轮检查

| 项目 | 结果 |
| --- | --- |
| `pnpm check` | TypeScript 通过，19 个文件共 106 项测试通过，Chrome MV3 生产构建成功；保留既有 chunk 大于 500 kB 的建议 |
| Playwright | 本轮独立 45 项通过，0 页面异常；假域名 favicon 在测试内本地响应，不依赖外网 |
| 视觉与状态 | 共用形状及选中色、标题与选项层级、辅助说明与统计、当前预设可用／幂等、自定义集合无当前预设、键盘焦点与部分选中 |
| 交互回归 | 五个独立字段、两个快捷动作、最后一项与非叠乘弱化、预览返回、取消、收起摘要、旧 URL／历史、全字段提交收敛、设计系统预览 |
| 适配 | 1440×900 深浅主题与英文；320×760 无横向溢出且底栏可见 |
| 清理 | `wispora-search-visual-1028`、补充浮层检查和基线对照会话均在 `try/finally` 中正常关闭；CLI 无浏览器，所属进程 34541／34665／35381／35864 已退出。任务所属 WXT 34118 经 SIGINT 正常关闭，5187 无监听 |
| 表面检测 | 单次检测在宽范围 `tokens.css` 报告 41 项既有命中：字号 34、圆角 3，以及字体、过度使用字体、弹性和颜色各 1；新增组件与改动样式区块无命中，不将这些既有值确认为本轮新规则 |

P3 解析色经浏览器 Canvas 采样后的对比度：

| 对象 | 深色 | 浅色 |
| --- | --- | --- |
| 勾线／实心品牌填充 | 6.22:1 | 6.22:1 |
| 选中边界／面板主表面 | 9.39:1 | 6.29:1 |
| 当前预设文字／表面 | 7.51:1 | 5.69:1 |
| 字段辅助文字／主表面 | 8.28:1 | 4.95:1 |

日志：`/tmp/wispora-search-visual-check.log`、`/tmp/wispora-search-visual-ui-output.txt`、`/tmp/wispora-search-visual-detector.json`。临时日志不作为仓库交付物。45 项为本轮独立检查，不与先前 33／21／46 项或各期测试数字累加。

补充检查发现工作台未筛选标签列表在选择第一项后，浮层与搜索框分别上移至视口 `top=-90px / -84px`，列表滚动从 `0` 到 `195px`。隔离恢复此前 markup 与 CSS 后复现完全相同的位置与滚动，归因为既有 FacetFilter 焦点／定位问题，未在本轮视觉细化中修复，也不记为新增回归或 45 项通过检查之一。对照结束在 `try/finally` 中恢复当前源码并校验字节一致；证据为 `/tmp/wispora-search-visual-popup-output.txt` 与 `/tmp/wispora-search-visual-baseline-output.txt`。

本轮使用 DEV 演示数据及三条合成 `.example` 数据，未读取个人收藏。真实系统输入法、VoiceOver / NVDA、浏览器 200% 缩放及完整 Chrome/Edge MV3 安装／权限／升级仍待人工验收；先前合成输入、reduced-motion 与缩放等效检查仍属于原次证据。未新增依赖、权限、数据模型、存储迁移或 ADR，也未提升版本。

## 当前截图

以下八张为实际本地应用视口捕获，等待字体、主题与有限动效稳定后拍摄，未使用 AI 图像。文档副本在原始 PNG 中添加 `Source` 与 `Description` 元数据，所有 `IDAT` 图像数据块与原捕获逐字节相同，像素未经重压缩。原捕获位于 `.impeccable/review/search-visual-2026-10-28/`。

| 状态 | 视口与来源 |
| --- | --- |
| [展开：深色](assets/command-search/visual-2026-10-28/expanded-dark.png) | 1440×900，网站范围，四个实际字段；`expanded-dark.png` |
| [当前预设：深色](assets/command-search/visual-2026-10-28/preset-dark.png) | 1440×900，标题及描述；`preset-dark.png` |
| [展开：浅色](assets/command-search/visual-2026-10-28/expanded-light.png) | 1440×900，标题及描述；`expanded-light.png` |
| [收起摘要](assets/command-search/visual-2026-10-28/collapsed-dark.png) | 1440×900，范围与明确字段名称；`collapsed-dark.png` |
| [最后一项](assets/command-search/visual-2026-10-28/single-field-dark.png) | 1440×900，单字段防护；`single-field-dark.png` |
| [窄屏](assets/command-search/visual-2026-10-28/mobile-dark.png) | 320×760；`mobile-dark.png` |
| [英文](assets/command-search/visual-2026-10-28/english.png) | 1440×900；`english.png` |
| [工作台标签筛选](assets/command-search/visual-2026-10-28/facet-dark.png) | 1440×900，共享实心复选指示器；`facet-dark.png` |

![展开后的搜索设置](assets/command-search/visual-2026-10-28/expanded-dark.png)

先前[交互梳理](command-search-interaction-2026-10-28.md)、[精确标签简化](command-search-tag-simplification-2026-10-28.md)、[首次修订](command-search-refinement-2026-10-28.md)与[二期验收](command-search-phase-two-validation.md)的事实、数字和截图保持历史原样。sidecar 既有紫色、Inter 及其他旧示例漂移不在本轮范围，不修复，也不确认为当前规范。
