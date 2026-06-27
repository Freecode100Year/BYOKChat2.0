<div align="center">

# BYOK Chat

**自托管 · 匿名 · 自带 Key 的多供应商 AI 聊天站**

部署在 Cloudflare，服务器零存储，所有数据只留在你自己的浏览器。

<sub>BYOK = Bring Your Own Key · OpenAI 兼容 · 单文件前端 · 无框架 · 无数据库</sub>

</div>

---

## 这是什么

BYOK Chat 是一个**纯前端 + 薄透传代理**的 AI 聊天网站。它不替你保管任何 API Key，也不在服务端存任何对话——你带上自己的 Key，它只负责把请求转发给你指定的供应商。所有对话、助理、记忆、供应商配置都存在你浏览器的 IndexedDB / localStorage 里，换个浏览器就是一张白纸。

适合这样的人：

- 手里有一个或多个大模型 API Key（OpenAI / Gemini / DeepSeek / 本地 Ollama……），想要一个**干净、不上传数据、能自己掌控**的聊天界面；
- 想把多个 Key 拼在一起用，**额度用满自动轮替**；
- 想一键部署到 Cloudflare、零服务器成本、无需登录注册。

> 它**不是**一个帮你白嫖订阅额度的工具。ChatGPT Plus / Gemini Advanced / SuperGrok 这类**网页订阅额度不对外开放 API**，本项目只走各家官方 API（用 API Key），不碰任何逆向私有接口的灰色地带。

---

## ✨ 功能一览

### 供应商 & Key 管理

- **完整多供应商**：配置任意数量供应商，每个填 `名称 + Base URL + 多个 Key + 模型列表`。模型在顶部按供应商分组选择，全程走 **OpenAI 兼容**格式（`/chat/completions`、`/images/generations`），不为各家私有格式写适配器。
- **按 Token 额度轮替**：每个 Key 可单独设 token 额度，累计消耗到额度后自动轮替到下一个 Key；优先用上游返回的真实 `usage`，拿不到时按字符估算兜底。额度周期支持「每日重置」或「永久累计」。
- **撞限额自动切换**：免费层撞到每分钟 / 每天的请求上限（HTTP 429）时，自动标记该 Key 用满、立刻切到下一个。
- **前端直连模式**：供应商可勾选「前端直连」，由浏览器**直接**请求其地址、不经服务器代理——专门用于本地 Ollama（`http://localhost:11434/v1`）这类 localhost 端点（云端代理本来访问不到你本机；浏览器访问自己的 localhost 被特许放行）。
- **一键预设**：内置 NVIDIA NIM、OpenRouter、DeepSeek、Groq、OpenAI、硅基流动、Ollama Cloud、本地 Ollama、Google Gemini、xAI Grok 的地址与示例模型，选一下即可。

### 对话能力

- **多助理**：内置 6 个模板，每个可自定义系统提示词、主模型、备用模型（fallback）、温度、top_p、最大 token、JSON 模式与专属知识库；支持单独导入 / 导出为 JSON。
- **审计员（Reviewer Agent）**：任意 AI 回复下点 🔍，用另一个模型以严格 reviewer 视角审查这条回复——查正确性、安全漏洞、性能、可读性，输出按严重度分级的问题清单；不合格可**一键采纳意见并打回重写**，由原助理带着审计反馈重新生成。审计员模型在左侧栏直接选择。功能栏「**完全控制**」开关（类似 agent 的自动化模式）一开，回复生成后会**自动审查 → 按意见重写 → 再复查，循环直到合格**（设有轮数上限防失控），把原本要你逐步点按的「审查 → 采纳 → 复查」全自动跑完。
- **Artifacts 沙箱预览**：回复里的 `html` / `svg` / `xml` 代码块可直接渲染预览，运行在 `sandbox` 隔离的 iframe 里（**故意不含 `allow-same-origin`**，无法访问你的页面与 Key）。
- **看图（Vision）**：上传图片随消息发给支持多模态的模型。
- **本地知识库（RAG）**：给助理挂参考资料，用 2-gram 词组检索召回相关片段，**不依赖任何 embedding 服务**，纯本地完成。
- **个人记忆**：维护一段「关于用户」的长期记忆随对话注入；可让 AI 从当前对话**自动提炼**要点补充进去。
- **文生图**：绘图助理调用 `/images/generations`。
- **多模型对比**：同一个问题并排发给多个模型，横向比较回答。
- **联网搜索（AI Search）**：两种用法——①直接用自带联网的供应商，如 **Perplexity** 的 `sonar` 模型、或 **OpenRouter** 模型名加 `:online` 后缀，零配置；②打开功能栏「🌐 联网」开关 + 填一个 **Tavily** Key，让**任何支持工具调用的模型**自主联网检索、并在回答下方附**参考来源**。
- 还有：Markdown 表格 / 代码 / 引用渲染、消息重新生成、流式输出、上下文消息数上限（控费）。
- **全局指令（对应 Claude Code 的 `CLAUDE.md`）**：一段**始终注入每次对话**的持久规则（编码规范 / 语气 / 架构约定），独立于具体助理；还可自定义审计员的**审查清单**，让「完全控制」按你的标准把关。
- **快捷指令（对应 slash command）**：自定义可复用提示词（如 `/翻译`、`/总结`），输入框打 `/` 即唤出选用。
- **上下文压缩（对应 `/compact`）**：长对话一键把前文**总结成摘要**替换原文，省 token 又保住要点（命令面板触发）。
- **沙箱代码执行 + 自修（最接近 Claude Code 的 act-verify）**：AI 写的 JS 代码块可在**沙箱里真跑**，捕获 `console` 输出与报错，一键把结果**喂回给 AI 自己修**，循环到跑通。
- **Skill 导入（Anthropic SKILL.md）**：粘贴或选择一个 `SKILL.md`，一键导入成**助理**（用其指令当系统提示词）或**快捷指令**。兼容 Skill Builder 生成的文件。
- **插件包**：把你的助理 + 快捷指令 + 全局指令 + MCP 配置打包成一个可分享文件（**不含** Key / 对话 / 记忆），导入时合并——适合分享一整套「智能体方案」。
- **MCP 远程工具（实验性）**：连接支持 HTTP/SSE 的远程 MCP 服务器，让模型自主调用其工具（与联网搜索共用同一套 function-calling 工具循环）。仅支持远程 https 端点，本地 stdio 类 MCP 与需 OAuth 的服务暂不支持。
- **Agent 模式（云端自主执行）**：功能栏开启 🤖 Agent 后，模型会自主规划并多步执行任务——反复调用联网搜索 / MCP 工具，每步展示「执行轨迹」（思考 + 工具调用），完成后给出结构化结果。内置护栏：最多 16 步、死循环自动检测、随时可按 ■ 停止。开启即授权自主执行（过程中工具调用可能产生副作用，建议只接信任的 MCP）。需可用工具 + 模型支持工具调用。
- **回复导出为文件**：每条 AI 回复右上角 ⤓ 可一键导出为 **Markdown / 网页(HTML) / Word(.doc) / PDF**（PDF 走浏览器打印另存）。纯浏览器零依赖，适合把调研结论、文档草稿直接存成可分享的文件。

### 数据 & 隐私

- **服务器零存储**：后端只是带 SSRF 防护的透传代理，不落任何对话 / Key / 日志，无数据库、无 KV。
- **全量备份**：一键导出 / 导入全部数据（对话 + 助理 + 供应商），可选**不含 Key** 以便安全分享；导入支持「合并」或「覆盖」。
- **供应商 Key 批量备份（Markdown）**：把所有供应商导出成易读、可手动编辑的 `.md`（名称 / 地址 / Key / 额度 / 模型 / 直连），按相同格式批量导入，**同名更新、新增追加**。适合多设备同步一批 Key。
- **关闭页面提醒**：改过配置又没导出备份时，关 / 刷新页面会触发浏览器的离开确认，避免本地数据被无意丢失（可关）。

### 其他

- **命令面板**（`Cmd/Ctrl + K`）快速调用各项功能
- **语音**：朗读回复（TTS）、语音输入（STT）
- **PDF 输入**：拖入 PDF 自动提取文本（pdf.js）
- **代码导出**：把当前配置导出成 `curl` / Python / JavaScript 调用代码
- **可选访问口令**：给站点加一道访问门槛（服务端校验）
- **PWA**：可「添加到主屏幕」当作 App 使用
- **全平台自适应**：响应式布局适配安卓 / iOS 手机与 Windows / macOS / Linux 桌面浏览器；处理了 iOS 的动态视口高度、刘海/Home 条安全区（`safe-area`）、输入框聚焦防放大（≥16px）、Safari 控件前缀等跨平台细节

---

## 🔒 安全设计

| 机制 | 说明 |
|------|------|
| **SSRF 防护** | 代理只允许公网 `https`，拒绝 `localhost`、`.local`/`.internal`、所有私有网段，并堵住十进制 / 十六进制 / 八进制 / IPv6 映射等 IP 绕过写法 |
| **Artifact 沙箱** | 预览 iframe 不含 `allow-same-origin`，运行在 null origin，无法读取页面的 localStorage / IndexedDB（你的 Key 在那里） |
| **XSS 转义** | Markdown / 表格渲染对所有用户与模型内容做 HTML 转义，链接限定 `http(s)` 协议 |
| **零硬编码** | 仓库代码不含任何 API Key |
| **本地直连隔离** | 直连模式下 Key 不经服务器；公网 API 不应勾直连（浏览器跨域会失败，反而保护你不误用） |

> ⚠️ 备份「含 Key」的文件里 Key 是**明文**，请妥善保管、勿公开上传。

---

## 🚀 部署到 Cloudflare Pages

无需服务器，几分钟搞定。

**方式一：连接 Git 仓库（推荐）**

1. Fork / clone 本仓库到你的 GitHub。
2. Cloudflare 控制台 → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**，选择该仓库。
3. 构建设置全部留空（这是纯静态站 + Functions，**无需构建命令、无需输出目录**）。
4. 部署完成即可访问。打开站点 → 右上角设置 → 配置你的供应商和 Key。

**方式二：本地用 Wrangler 部署**

```bash
npm i -g wrangler
wrangler pages deploy . --project-name byok-chat
```

部署后，`functions/` 目录下的文件会自动成为 `/api/*` 接口，`_routes.json` 已限定只有 `/api/*` 走 Functions、其余走静态资源。

---

## ⚙️ 环境变量（全部可选）

在 Cloudflare Pages 项目的 **Settings → Environment variables** 配置，**全部可以不设**——不设时就是一个纯匿名、纯 BYOK 的站点。

| 变量 | 作用 |
|------|------|
| `SITE_NAME` | 站点名称（默认 `AI Chat`） |
| `ACCESS_PASSWORD` | 设置后，访问需要输入口令（服务端校验） |
| `IMAGE_MODEL` | 文生图默认模型（默认 `dall-e-3`） |
| `PRESET_PROVIDERS` | 预置供应商列表（JSON 字符串），下发给前端作为默认配置 |
| `API_BASE` + `MODELS` | 向后兼容写法：用单个 Base URL + 逗号分隔的模型名生成一个默认供应商 |

---

## 🧩 配置供应商

进入站点 → 设置 → 供应商区，可手动添加，或用「快速添加」选预设。常见预设：

| 供应商 | Base URL | 备注 |
|--------|----------|------|
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` | 免费层最慷慨，AI Studio 拿 Key |
| OpenAI | `https://api.openai.com/v1` | 新号有试用赠金 |
| Perplexity | `https://api.perplexity.ai` | sonar 系列**自带联网搜索**，返回带引用的答案 |
| xAI Grok | `https://api.x.ai/v1` | 注册送 API 赠金 |
| DeepSeek | `https://api.deepseek.com/v1` | |
| OpenRouter | `https://openrouter.ai/api/v1` | 聚合多家，含免费模型 |
| Groq | `https://api.groq.com/openai/v1` | 推理极快，有免费层 |
| 硅基流动 | `https://api.siliconflow.cn/v1` | |
| NVIDIA NIM | `https://integrate.api.nvidia.com/v1` | 免费层 |
| Ollama Cloud | `https://ollama.com/v1` | 公网 https + Key |
| 本地 Ollama | `http://localhost:11434/v1` | 勾「前端直连」，无需 Key |

> **本地 Ollama 用前提醒**：需让 Ollama 允许本站跨域——设置环境变量 `OLLAMA_ORIGINS=*`（或填本站域名）后重启 Ollama；模型名用你本地 `ollama pull` 过的（如 `llama3.3`）。
>
> **预设模型名会随各家更新而变化**，以官方控制台为准，可在供应商卡片里随时改。

---

## 🛠️ 技术栈

- **前端**：单个 `index.html`，原生 JavaScript，**零框架、零构建、零运行时依赖**（PDF 解析的 pdf.js 按需从 CDN 加载）
- **后端**：Cloudflare Pages Functions，仅做透传代理 + SSRF 校验 + 下发配置
- **存储**：浏览器 IndexedDB（对话 / 助理）+ localStorage（设置 / 供应商）——**无服务端数据库、无 KV**
- **协议**：全程 OpenAI 兼容 API

---

## 📁 项目结构

```
.
├── index.html              前端单文件（UI + 全部逻辑）
├── manifest.webmanifest    PWA 清单
├── _routes.json            只让 /api/* 走 Functions
├── wrangler.toml           Cloudflare 配置
├── README.md               就是这份文件
└── functions/
    └── api/
        ├── chat.js         聊天透传代理（+ SSRF 防护）
        ├── image.js        文生图透传代理（+ SSRF 防护）
        ├── config.js       下发站点配置与预设供应商
        └── search.js       联网搜索代理（Tavily）
        └── mcp.js          远程 MCP 代理（JSON-RPC over HTTP/SSE）
```

---

## 💻 本地开发

```bash
# 用 Wrangler 在本地起一个带 Functions 的开发服务器
npm i -g wrangler
wrangler pages dev .
```

前端是纯静态文件，改完 `index.html` 刷新即可；`functions/` 下的改动由 Wrangler 热加载。

---

## ❓ 常见问题

**Q：我的 Key 安全吗？会被你收集吗？**
A：Key 只存在你自己的浏览器里。每次请求时，前端把 Key 放在请求头发给代理，代理转发给你指定的供应商后即丢弃，不落库、不记日志。代码开源可自行审计；介意的话也可以勾「前端直连」让浏览器直接连供应商，连代理都不经过。

**Q：能用 ChatGPT Plus / Gemini Advanced 的订阅额度吗？**
A：不能。这些是网页 / App 订阅，**不对外提供 API**，订阅额度无法用于程序调用。本项目只走各家**官方 API**（用 API Key），请在对应控制台获取。

**Q：本地 Ollama 连不上？**
A：八成是跨域。给 Ollama 设 `OLLAMA_ORIGINS=*` 并重启；并确认供应商勾了「前端直连」、地址是 `http://localhost:11434/v1`。

**Q：换了电脑 / 清了缓存，数据没了？**
A：数据只存在浏览器本地。换设备前请用「导出全部数据」或「导出供应商为 Markdown」备份，到新设备导入。

**Q：免费额度用完了怎么办？**
A：在同一个供应商里换行填多个 Key（比如多个账号的免费 Key），撞限额会自动轮替到下一个；也可以配多个供应商互为备用（助理可设 fallback 模型）。

---

## 📄 License

[MIT](LICENSE) — 自由使用、修改、自托管。

> 如需此协议，请在仓库根目录添加 `LICENSE` 文件，也可按需替换为其他开源协议。

---

<div align="center">
<sub>本项目仅作为聊天界面，不附带任何模型额度；调用产生的费用由你与各 API 供应商之间结算。</sub>
</div>
