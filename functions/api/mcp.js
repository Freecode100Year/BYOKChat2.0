// /api/mcp — 远程 MCP 代理（Streamable HTTP / SSE）。BYOK：用户自带 MCP 服务器地址与 Token。
// 前端传 x-mcp-url + x-mcp-token + x-mcp-session + JSON-RPC body，后端转发，不保存任何东西。
function json(d, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
function parseAllowedHosts(env) {
  if (!env || !env.ALLOWED_MCP_HOSTS) return null;
  return env.ALLOWED_MCP_HOSTS.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
}
function validBase(base, env) {
  let u; try { u = new URL(base); } catch { return false; }
  if (u.protocol !== "https:") return false;
  let h = u.hostname.toLowerCase();
  const allowed = parseAllowedHosts(env);
  if (allowed) return allowed.includes(h);
  if (h.startsWith("[") && h.endsWith("]")) h = h.slice(1, -1);
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".localhost")) return false;
  if (h === "::1" || h === "::" || /^(fc|fd|fe80|::ffff:)/i.test(h)) return false;
  if (!/[a-z]/i.test(h)) {
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return false;
    if (h.split(".").some(o => +o > 255)) return false;
  }
  if (/^(0\.|127\.|10\.|192\.168\.|169\.254\.)/.test(h) || h === "0.0.0.0") return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
  return true;
}
const ALLOWED_MCP_METHODS = new Set([
  "initialize", "ping",
  "tools/list", "tools/call",
  "resources/list", "resources/read", "resources/templates/list",
  "prompts/list", "prompts/get",
  "completion/complete",
  "notifications/initialized", "notifications/cancelled",
]);
export async function onRequestPost(context) {
  const { request, env } = context;
  if (env.ACCESS_PASSWORD) {
    const pwd = request.headers.get("x-access-password") || "";
    if (pwd !== env.ACCESS_PASSWORD) return json({ error: { message: "访问口令错误或缺失。" } }, 401);
  }
  const url = (request.headers.get("x-mcp-url") || "").trim();
  if (!url) return json({ error: { message: "未指定 MCP 服务器地址。" } }, 400);
  if (!validBase(url, env)) return json({ error: { message: "MCP 地址必须是公网 https，且不能是 localhost 或内网地址。" } }, 400);
  const token = (request.headers.get("x-mcp-token") || "").trim();
  const session = (request.headers.get("x-mcp-session") || "").trim();
  const body = await request.text();
  try {
    const rpc = JSON.parse(body);
    const method = rpc.method || "";
    if (method && !ALLOWED_MCP_METHODS.has(method)) return json({ error: { message: `不支持的 MCP 方法：${method}` } }, 400);
  } catch { return json({ error: { message: "MCP 请求体不是合法 JSON。" } }, 400); }

  const headers = { "content-type": "application/json", "accept": "application/json, text/event-stream" };
  if (token) headers.authorization = `Bearer ${token}`;
  if (session) headers["mcp-session-id"] = session;

  let r;
  try {
    r = await fetch(url, { method: "POST", headers, body });
  } catch (e) { console.error("mcp upstream error:", e); return json({ error: { message: "连接 MCP 服务器失败，请检查地址与网络后重试。" } }, 502); }

  const ct = r.headers.get("content-type") || "";
  const newSession = r.headers.get("mcp-session-id") || "";
  let text = await r.text();
  // SSE 响应：抽取 data: 行拼成 JSON
  let payload = text;
  if (ct.includes("text/event-stream")) {
    const dataLines = text.split(/\r?\n/).filter(l => l.startsWith("data:")).map(l => l.slice(5).trim());
    payload = dataLines.join("");
  }
  return json({ status: r.status, sessionId: newSession, body: payload });
}
