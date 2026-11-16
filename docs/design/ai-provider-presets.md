# AI 提供商预设

核对日期：2026-11-01。设置只保存当前提供商配置，切换提供商不会复用上一家的 Key。模型 ID 允许自定义，预设不保证账户权限或地域可用性。

- [Gemini OpenAI 兼容接口](https://ai.google.dev/gemini-api/docs/openai)：兼容地址、推理强度与 JSON 输出。
- [Gemini 模型](https://ai.google.dev/gemini-api/docs/models)：Flash 与 Flash-Lite 预设。
- [Qwen 兼容接口](https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope)：北京旧域名仍支持，可替换业务空间或其他地域地址；Key 与地域必须匹配。
- [Qwen 模型](https://help.aliyun.com/zh/model-studio/models)：当前通用文本模型。
- [Kimi 模型](https://platform.kimi.com/docs/models)：使用 K3 系列，旧 moonshot-v1、K2.5 已下线。
- [Kimi 思考模型](https://platform.kimi.com/docs/guide/use-thinking-models)：K3 使用 reasoning_effort，分析预留 16,384 token，避免思考占满原有 600 token。省略 temperature。
- [OpenRouter 接口](https://openrouter.ai/docs/api/reference/overview)与[模型目录](https://openrouter.ai/api/v1/models)：沿用兼容 Chat Completions 协议。

[OpenAI 模型列表](https://developers.openai.com/api/reference/resources/models/methods/list)通过 GET /models 返回当前 Key 可见的模型；其他兼容服务使用同一相对路径。不支持列表接口时原位显示错误并保留手动填写。模型列表仅保存在当前设置组件的内存中，刷新不会自动换模型；不承诺列表中的每一项均支持文本 Chat Completions，需连接测试确认。列表请求由可信扩展页面发消息到 Service Worker，禁止重定向，15 秒超时。使用未保存 Key 不写入存储；已保存 Key 仅可复用于相同提供商和 origin。未启用的／非当前保存提供商的临时域名权限在成功或失败后撤销。

[OpenAI Chat Completions 参数](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)中，GPT-5+ 与 o 系列的请求改用 max_completion_tokens 并省略 temperature，分析预留推理预算。列表接口并不提供完整能力信息；仅 Responses 模型、图像／音频／embedding 等模型不保证支持现有的文本整理接口。

连接测试和队列处理共享参数。测试不保存 Key、不处理收藏项；权限继续遵循 ADR 0004，按需授予单一域名。未使用真实账户 Key 验证付费 API，自动化请求验证使用模拟响应。

DeepSeek 默认模型更新为官方 ID `deepseek-flash`。根据[官方模型说明](https://api-docs.deepseek.com/quick_start/pricing/)，2026-11-01 该 ID 对应 DeepSeek-V4.1-Flash-1017；界面在预设和实时列表中均显示“DeepSeek V4.1 Flash（deepseek-flash）”，保存和请求仍使用原始 ID。已有旧 ID 不自动改写。

名称字段修正：模型列表现在保留提供商返回的 `{ id, name? }`，UI 优先使用 `name` 并附上原始 ID。提供商没有返回名称时，才回退到预设显示名称或 ID。DeepSeek [Lists Models](https://api-docs.deepseek.com/api/list-models/) 明确定义可选的 `name` 字段。旧实现只返回字符串 ID，导致该字段被丢弃；现已修正，去重也不会因同 ID 的无名称记录而丢失已有名称。名称仅供显示，不写入用于调用的 model 设置。
