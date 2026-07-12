import { corsHeaders, jsonResponse, serviceClient, getClientIp, lookupCountry } from "../_shared/session.ts";
import { sendSessionCreated } from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const { device, panel_slug, user_agent, referrer } = body ?? {};

    const supabase = serviceClient();
    const ip = getClientIp(req);
    const country = await lookupCountry(ip);

    let panel_id: string | null = null;
    if (panel_slug && typeof panel_slug === "string") {
      const { data } = await supabase
        .from("panels")
        .select("id")
        .eq("slug", panel_slug)
        .eq("active", true)
        .maybeSingle();
      panel_id = data?.id ?? null;
    }

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        device: device ?? null,
        step: "landing",
        ip,
        country,
        user_agent: typeof user_agent === "string" ? user_agent.slice(0, 500) : null,
        panel_id,
      })
      .select("id, access_token")
      .single();

    if (error) return jsonResponse({ error: error.message }, 500);

    await supabase.from("session_events").insert({
      session_id: data.id,
      event_type: "created",
      payload: { referrer: referrer ?? null },
    });

    sendSessionCreated(data.id).catch((e) => console.error("telegram created send failed", e));

    return jsonResponse({ session_id: data.id, access_token: data.access_token });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
