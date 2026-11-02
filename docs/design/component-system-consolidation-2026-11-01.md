# 组件与设计系统收口

日期：2026-11-01。范围为当前工作区的组件复用、设计系统预览、变量一致性与中英文说明，不调整收藏库的数据模型或扩展权限。

## 组件整理结果

| 对象 | 处理 |
| --- | --- |
| AiSettingsDialog、ArchiveDialog、BackupDialog、TagManagerDialog | 删除无打开入口的旧弹窗、挂载与状态，使用独立设置页 |
| AnimatedSearchField、StatusDot、SegmentedControl | 删除无生产调用的旧控件及对应专用样式，排列继续使用 LibraryLayoutSelect |
| SettingsPrimitives | 从 feature 移到 components/settings，设置页、简报与预览共用 |
| SearchField | 增加 CompactSearchField，收口标签管理、简报历史、FacetFilter 的图标／输入／清除组合，清除后保留输入焦点 |
| TagInput | 可移除标签使用 Badge，保留原输入与候选定位行为 |
| Menu、ContextMenu、SavedViewNavItem | 共用 MenuSurface、MenuItem 与通用状态；保留指针与锚点两种定位；快捷视图删除使用 ConfirmDialog |
| Modal | 提供 FormDialogHeader、FormDialogFooter，添加与书签导入共用 |
| 书签导入 | 设置页与弹窗共用 BookmarkImportFields、useBookmarkImport；保留设置页结果与撤回流程 |

RadioGroup 与 ToggleGroup 继续分别表达必选互斥值、可取消单选／多选。卡片与列表继续保留不同内容结构，没有因视觉相似合并领域组件。

## 变量与预览

- `tokens.css` 保存颜色、字号、圆角、阴影、间距、比例和动效定义；`styles.css` 承载通用与页面样式；开发路由单独加载 `preview.css`。
- `radius-media` 复用 `radius-panel`；同值且语义相关的颜色和动效通过别名关联，深色标签文字继续保留独立覆盖。
- 侧栏尺寸由 `sidebar.ts` 同时提供给偏好逻辑及 AppShell CSS，避免两套数值。
- 补齐主色表面的文字、添加按钮边界、弹窗遮罩和组件阴影的语义变量。新增颜色提供 sRGB 与 Display-P3 定义，组件不直接写颜色值。
- 色板从源码生成，完整显示 53 个颜色 token 的深浅主题六位大写 HEX 参考值，透明度单列在值后；色块仍通过 P3 token 渲染。
- 基础目录展示圆角、阴影、排版、尺寸、间距、比例及动效时间／曲线，并提供遵循 reduced-motion 的动效示例。
- 新增 TagInput、CompactSearchField、锚点菜单、右键菜单、表单／确认弹窗、Tooltip、ScrollArea、FavoriteButton、SiteIcon、TagSummary、CoverArt、设置布局和书签表单的实际组件示例。原有搜索面板、卡片、列表和通知示例保留。
- 设计系统界面说明、操作和搜索场景补齐英文；既有用户内容及演示收藏内容保持原文。翻译覆盖检查已包含开发目录。

## 验证

- `pnpm check`：22 个测试文件、164 项测试、类型检查与 Chrome MV3 生产构建通过。
- 新增变量完整性检查：未定义变量、颜色的 P3 配对及深浅主题色板覆盖。
- 浏览器组件验证：菜单键盘操作与焦点返回、右键菜单、标签创建及移除、搜索清除、表单提交、确认取消、快捷视图改名／取消删除、英文切换、深色主题、390px 和 reduced-motion。
- 真实页面回归：书签无效链接拒绝、导入去重、刷新持久化、设置页重复导入、成功反馈与撤回、390px 英文设置、快捷视图拖动排序、删除视图后收藏保留、默认侧栏宽度，以及搜索清除后的焦点。
- 浏览器使用独立测试会话与真实 IndexedDB。开发预览中的扩展后台唤醒消息采用模拟；没有调用收费 API，也不以此替代真实 Chrome／Edge MV3 发布验收。
- Impeccable 机械检查发现 16 项 advisory，均为原有封面／图形尺寸、原有标题字号或已确认 Switch 弹性曲线；本次保留，不擅自改动既有视觉。没有阻断项。
- 测试浏览器通过 `try/finally` 正常关闭；测试开发服务器在结束时停止，并检查进程退出。
