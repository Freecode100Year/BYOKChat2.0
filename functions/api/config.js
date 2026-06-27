// /api/config — 下发站点配置与可选的预设供应商
function json(d, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
export async function onRequestGet(context) {
  const { env } = context;
  let presetProviders = [];
  if (env.PRESET_PROVIDERS) {
    try { presetProviders = JSON.parse(env.PRESET_PROVIDERS); } catch { presetProviders = []; }
  } else if (env.API_BASE) {
    // 向后兼容：用 API_BASE + MODELS 作为一个默认供应商预设
    presetProviders = [{
      name: env.SITE_NAME || "默认供应商",
      baseUrl: env.API_BASE,
      models: (env.MODELS || "gpt-4o-mini").split(",").map(s => s.trim()).filter(Boolean),
    }];
  }
  return json({
    siteName: env.SITE_NAME || "AI Chat",
    needPassword: !!env.ACCESS_PASSWORD,
    imageModelDefault: env.IMAGE_MODEL || "dall-e-3",
    presetProviders,
  });
}
