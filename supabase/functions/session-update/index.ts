import { corsHeaders, jsonResponse, serviceClient, verifyToken } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const { session_id, access_token, step, device, seed_length } = await req.json();
    if (!session_id || !access_token) return jsonResponse({ error: "missing_credentials" }, 400);

    const supabase = serviceClient();
    const check = await verifyToken(supabase, session_id, access_token);
    if (!check.ok) return jsonResponse({ error: "unauthorized" }, 401);

    const patch: Record<string, unknown> = { last_seen_at: new Date().toISOString() };
    if (typeof step === "string") patch.step = step;
    if (typeof device === "string") patch.device = device;
    if (typeof seed_length === "number") patch.seed_length = seed_length;

    const { error } = await supabase.from("sessions").update(patch).eq("id", session_id);
    if (error) return jsonResponse({ error: error.message }, 500);

    await supabase.from("session_events").insert({
      session_id,
      event_type: "updated",
      payload: patch,
    });

    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
