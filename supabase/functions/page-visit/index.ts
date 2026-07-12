import { corsHeaders, jsonResponse, serviceClient, getClientIp, lookupCountry } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const { panel_id, path, user_agent, referrer } = body ?? {};
    if (!path || typeof path !== "string") return jsonResponse({ error: "path required" }, 400);

    const supabase = serviceClient();
    const ip = getClientIp(req);
    const country = await lookupCountry(ip);

    const { error } = await supabase.from("page_visits").insert({
      panel_id: panel_id ?? null,
      path: path.slice(0, 200),
      ip,
      country,
      user_agent: typeof user_agent === "string" ? user_agent.slice(0, 500) : null,
      referrer: typeof referrer === "string" ? referrer.slice(0, 500) : null,
    });
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
