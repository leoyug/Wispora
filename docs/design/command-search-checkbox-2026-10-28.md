# 复选框外观校正与验证

日期：2026-10-28。版本仍为 `0.7.2`。用户在最新批注 1 中明确要求恢复原标签筛选复选框：默认灰色边框，选中实心橙框与白色描边勾线，保留原动画。该指示取代上一轮的深色勾线与高对比选中边界方向；本记录不将白色勾线描述为满足 `3:1`，也不作通用对比度认证。

## 当前实现

- `Checkbox` 与 `FacetFilter` 继续共用 `CheckboxIndicator`：原 `16px` 形状、`radius-tag` 圆角、勾线路径与 `1.5` 描边。默认边界为 `border-strong` 灰色；选中／部分选中边界与填充均为 `brand`，标记固定白色。根 `--color-checkbox-mark` 使用 P3 `color(display-p3 1 1 1)` 与 sRGB `#FFFFFF`，深浅主题共同继承。
- 原动画保持不变：盒面 `150ms`、勾线绘制 `350ms`、延迟 `0ms`、取消勾选 `150ms`，曲线 `cubic-bezier(.22,1,.36,1)`；reduced-motion 下取消过渡。键盘焦点仍为 `accent-ink` 的 `2px` 外框、偏移 `2px`。
- 本轮源修改仅涉及 `checkbox.css`、`tokens.css` 和设计系统色块。排版、预设按钮、查询与控制器、最后一项防护、预览、取消和提交规则均沿用既有实现；未新增依赖、权限、模型、ADR 或版本变化。

## 本轮检查

| 项目 | 结果 |
| --- | --- |
| `pnpm check` | TypeScript 通过；19 个文件共 106 项测试通过；Chrome MV3 生产构建成功 |
| 专项浏览器检查 | 独立 18 项通过，0 页面异常；检查原灰边／橙框／白色勾线、共享几何、真实描边动画、reduced-motion 与键盘行为 |
| 动画实测 | 捕获实际 `stroke-dashoffset` CSS transition，持续 `350ms`；原盒面、绘制、延迟、取消与曲线参数一致 |
| 表面检测 | 对 `checkbox.css` 与 `CheckboxIndicator` 的单次范围检测为空列表 |
| 截图 | 下列四张实际应用捕获均由主任务打开确认有效 |

日志：`/tmp/wispora-search-checkbox-check.log`、`/tmp/wispora-search-checkbox-ui-output.txt`、`/tmp/wispora-search-checkbox-detector.json`。18 项是本轮专项检查，不与上一轮 45 项或此前检查累加。使用 DEV 演示与合成数据，未读取个人收藏。真实系统输入法、屏幕阅读器、浏览器 200% 缩放与完整 Chrome/Edge MV3 发布验收仍待人工完成。

独立完整复核结论为 `ship`：在用户明确指定的复选外观恢复范围内，持久化与视觉保真一致，四张捕获有效，无必须修复项；不作新的对比度认证。专项会话 `wispora-search-checkbox-1028` 已在 `try/finally` 中正常关闭，CLI 无浏览器，控制进程 `41512` 及所属 Playwright profile 进程均已退出。确认项目路径与端口归属后，任务 WXT `41239` 经 SIGINT 正常关闭；复查无该 PID 或 5187 监听。检查与截图后未再修改源码。

## 当前截图

以下为本地应用实际视口捕获，字体、主题与有限动效稳定后拍摄，未使用 AI 图像。每张文档副本含 `Source` 与 `Description` 元数据；`IDAT` 图像数据块与 `.impeccable/review/search-checkbox-2026-10-28/` 原捕获逐字节相同，像素未经重压缩。

| 状态 | 视口 |
| --- | --- |
| [工作台标签筛选：深色](assets/command-search/checkbox-2026-10-28/facet-dark.png) | 1440×900 |
| [搜索字段：深色](assets/command-search/checkbox-2026-10-28/search-dark.png) | 1440×900 |
| [搜索字段：浅色](assets/command-search/checkbox-2026-10-28/search-light.png) | 1440×900 |
| [搜索字段：窄屏](assets/command-search/checkbox-2026-10-28/mobile-dark.png) | 320×760 |

![搜索字段恢复原橙框白色勾线](assets/command-search/checkbox-2026-10-28/search-dark.png)

[上一轮整体视觉记录](command-search-visual-2026-10-28.md)及更早交互、标签简化和各期记录、截图保持历史原样，包含当时的 45 项检查与 `6.22:1` 深色标记采样；这些数值不用于描述本次白色勾线。既有 sidecar 的紫色、Inter 与其他旧示例漂移不在本轮范围。
