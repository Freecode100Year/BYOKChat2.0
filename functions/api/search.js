// /api/search — 联网搜索代理（默认 Tavily），BYOK：用户自带搜索服务 Key。
// 前端传 x-search-key（用户的 Tavily Key）+ body {query, max_results}，后端转发，不保存任何东西。
function json(d, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
export async function onRequestPost(context) {
  const { request, env } = context;
  if (env.ACCESS_PASSWORD) {
    const pwd = request.headers.get("x-access-password") || "";
    if (pwd !== env.ACCESS_PASSWORD) return json({ error: { message: "访问口令错误或缺失。" } }, 401);
  }
  const key = (request.headers.get("x-search-key") || "").trim();
  if (!key) return json({ error: { code: "search_key_required", message: "需要搜索服务的 API Key（如 Tavily）。" } }, 401);

  let body; try { body = await request.json(); } catch { return json({ error: { message: "请求体不是合法 JSON。" } }, 400); }
  const query = (body.query || "").toString().trim().slice(0, 400);
  if (!query) return json({ error: { message: "缺少搜索关键词。" } }, 400);
  const max = Math.min(Math.max(+body.max_results || 5, 1), 10);

  try {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ api_key: key, query, max_results: max, search_depth: "basic", include_answer: false }),
    });
    let data; try { data = await r.json(); } catch { data = {}; }
    if (!r.ok) return json({ error: { message: (data && (data.error || data.detail || data.message)) || ("搜索失败 " + r.status) } }, r.status);
    const results = (data.results || []).map(x => ({ title: x.title || "", url: x.url || "", content: (x.content || "").toString().slice(0, 1200) }));
    return json({ results });
  } catch (e) { return json({ error: { message: "搜索请求失败：" + e.message } }, 502); }
}
