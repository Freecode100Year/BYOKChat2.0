function validBase(base, env) {
    const u = new URL(base);
    const protocol = u.protocol;
    if ((protocol != "https:")) {
        return false;
    }
    const hostname = u.hostname.toLowerCase();
    if ((hostname == "localhost")) {
        return false;
    }
    return true;
}

export async function onRequestPost(context) {
    const request = context.request;
    const env = context.env;
    const userKey = request.headers.get("x-user-key");
    if (!userKey) {
        return new Response("{\"error\": \"Missing API Key\"}", { status: 401 });
    }
    const base = request.headers.get("x-base-url");
    const isValid = validBase(base, env);
    if (!isValid) {
        return new Response("{\"error\": \"Invalid Upstream Base URL\"}", { status: 400 });
    }
    const reqBody = await request.text();
    const upstreamUrl = (base + "/chat/completions");
    const upstream = await fetch(upstreamUrl, { method: "POST", body: reqBody });
    return new Response(upstream.body, { status: upstream.status });
}
