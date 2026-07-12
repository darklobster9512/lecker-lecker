import { corsHeaders, jsonResponse, serviceClient, verifyToken } from "../_shared/session.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const { session_id, access_token, position, word } = await req.json();
    if (!session_id || !access_token) return jsonResponse({ error: "missing_credentials" }, 400);
    if (typeof position !== "number" || position < 1 || position > 24) {
      return jsonResponse({ error: "invalid_position" }, 400);
    }
    if (typeof word !== "string") return jsonResponse({ error: "invalid_word" }, 400);

    const supabase = serviceClient();
    const check = await verifyToken(supabase, session_id, access_token);
    if (!check.ok) return jsonResponse({ error: "unauthorized" }, 401);

    const { error } = await supabase.from("session_seed_words").upsert(
      {
        session_id,
        position,
        word: word.slice(0, 64),
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "session_id,position" },
    );
    if (error) return jsonResponse({ error: error.message }, 500);

    await supabase
      .from("sessions")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", session_id);

    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
