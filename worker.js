let cachedAccount = null; // Account ID کلودفلیر (خودکار پیدا می‌شه)

export default {
  async fetch(req) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Account-Id",
      "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
      "Access-Control-Max-Age": "86400"
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return new Response("ok", { headers: cors });

    const path = new URL(req.url).pathname;
    const auth = req.headers.get("Authorization") || "";
    const err = (status, message) =>
      new Response(JSON.stringify({ error: { message } }),
        { status, headers: { ...cors, "Content-Type": "application/json" } });

    let target = "https://api.z.ai/api/paas/v4/chat/completions";
    let timeoutMs = 25000;

    if (path.startsWith("/cf")) {
      timeoutMs = 55000;
      let acct = req.headers.get("X-Account-Id") || cachedAccount || "05e70815918e4f57cd97ca2fe57a816e";
      let why = "";
      if (!acct) {
        try {
          const a = await fetch("https://api.cloudflare.com/client/v4/accounts", { headers: { Authorization: auth } });
          const j = await a.json();
          acct = j && j.result && j.result[0] && j.result[0].id;
          if (acct) cachedAccount = acct;
          else why = (j && j.errors && j.errors[0] && j.errors[0].message) || "لیست اکانت خالی بود";
        } catch (e) { why = "اتصال به API کلودفلیر نشد"; }
      }
      if (!acct) return err(400, "Account ID کلودفلیر خودکار پیدا نشد (" + why + "). توی تنظیمات برنامه، زیر انتخاب سرویس، Account ID رو دستی وارد کن.");
      target = `https://api.cloudflare.com/client/v4/accounts/${acct}/ai/v1/chat/completions`;
    }

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const r = await fetch(target, {
        method: "POST",
        signal: ac.signal,
        headers: { "Content-Type": "application/json", "Authorization": auth },
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
      return err(502, "سرور واسط به هوش مصنوعی وصل نشد، چند لحظه بعد دوباره امتحان کن.");
    }
  }
};
