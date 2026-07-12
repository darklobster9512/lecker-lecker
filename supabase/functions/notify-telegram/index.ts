import { corsHeaders, jsonResponse, serviceClient } from "../_shared/session.ts";
import { sendSeedNotification, sendTestMessage } from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "unauthorized" }, 401);

    const supabase = serviceClient();
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return jsonResponse({ error: "unauthorized" }, 401);

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) return jsonResponse({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));

    if (body?.test === true) {
      const result = await sendTestMessage();
      return jsonResponse({ ok: true, ...result });
    }

    const { session_id } = body ?? {};
    if (!session_id) return jsonResponse({ error: "missing session_id" }, 400);

    const result = await sendSeedNotification(session_id);
    return jsonResponse({ ok: true, ...result });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
