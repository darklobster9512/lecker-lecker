import { corsHeaders, jsonResponse, serviceClient } from "../_shared/session.ts";
import { sendTelegramForSession } from "../_shared/telegram.ts";

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

    const { session_id } = await req.json();
    if (!session_id) return jsonResponse({ error: "missing session_id" }, 400);

    const result = await sendTelegramForSession(session_id);
    return jsonResponse({ ok: true, ...result });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
