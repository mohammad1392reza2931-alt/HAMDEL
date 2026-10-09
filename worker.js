export default {
  async fetch(req) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "POST,OPTIONS"
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return new Response("ok", { headers: cors });

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 25000);
    try {
      const r = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
        method: "POST",
        signal: ac.signal,
        headers: {
          "Content-Type": "application/json",
          "Authorization": req.headers.get("Authorization") || ""
        },
        body: await req.text()
      });
      clearTimeout(t);
      return new Response(r.body, {
        status: r.status,
        headers: {
          ...cors,
          "Content-Type": r.headers.get("Content-Type") || "application/json",
          "Cache-Control": "no-cache"
        }
      });
    } catch (e) {
      clearTimeout(t);
      return new Response(
        JSON.stringify({ error: { message: "سرور واسط به هوش مصنوعی وصل نشد، چند لحظه بعد دوباره امتحان کن." } }),
        { status: 502, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }
  }
};
