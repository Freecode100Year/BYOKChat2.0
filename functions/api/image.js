// /api/image — 纯 BYOK 多供应商文生图透传代理（/images/generations）
function json(d, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
function parseAllowedHosts(env) {
  if (!env || !env.ALLOWED_API_HOSTS) return null;
  return env.ALLOWED_API_HOSTS.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
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
export async function onRequestPost(context) {
  const { request, env } = context;
  if (env.ACCESS_PASSWORD) {
    const pwd = request.headers.get("x-access-password") || "";
    if (pwd !== env.ACCESS_PASSWORD) return json({ error: { message: "访问口令错误或缺失。" } }, 401);
  }
  const userKey = (request.headers.get("x-user-key") || "").trim();
  if (!userKey) return json({ error: { code: "byok_required", message: "文生图需要你自己的 API Key。" } }, 401);
  const base = (request.headers.get("x-base-url") || env.API_BASE || "").trim().replace(/[?#].*$/, "").replace(/\/+$/, "").replace(/\/(chat\/completions|images\/generations|completions|embeddings)$/i, "").replace(/\/+$/, "");
  if (!base) return json({ error: { message: "未指定上游 API 地址。" } }, 400);
  if (!validBase(base, env)) return json({ error: { message: "上游地址必须是公网 https，且不能是 localhost 或内网地址。" } }, 400);

  let body; try { const raw = await request.text(); if (raw.length > 2 * 1024 * 1024) return json({ error: { message: "请求体过大。" } }, 413); body = JSON.parse(raw); } catch { return json({ error: { message: "请求体不是合法 JSON。" } }, 400); }
  let upstream;
  try {
    upstream = await fetch(`${base}/images/generations`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${userKey}` },
      body: JSON.stringify(body),
    });
  } catch (e) { console.error("image upstream error:", e); return json({ error: { message: "连接上游失败，请检查地址与网络后重试。" } }, 502); }
  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
