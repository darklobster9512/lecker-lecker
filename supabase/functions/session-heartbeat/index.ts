import { corsHeaders, jsonResponse, serviceClient, verifyToken } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const { session_id, access_token } = await req.json();
    if (!session_id || !access_token) return jsonResponse({ error: "missing_credentials" }, 400);

    const supabase = serviceClient();
    const check = await verifyToken(supabase, session_id, access_token);
    if (!check.ok) return jsonResponse({ error: "unauthorized" }, 401);

    const { error } = await supabase
      .from("sessions")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", session_id);
    if (error) return jsonResponse({ error: error.message }, 500);

    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
