// deno-lint-ignore-file no-explicit-any
import { corsHeaders, jsonResponse, serviceClient } from "../_shared/session.ts";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/telegram-webhook`;

async function tgSend(chatId: number | string, text: string) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch(() => {});
}

function parseCommand(text: string): "on" | "off" | null {
  const t = text.trim().toLowerCase().split(/\s+/)[0];
  const cmd = t.split("@")[0];
  if (cmd === "/on") return "on";
  if (cmd === "/off") return "off";
  return null;
}

async function requireAdmin(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }
  const supabase = serviceClient();
  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData?.user) return jsonResponse({ error: "unauthorized" }, 401);
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });
  if (!isAdmin) return jsonResponse({ error: "forbidden" }, 403);
  return null;
}

async function handleSetup(): Promise<Response> {
  if (!BOT_TOKEN) return jsonResponse({ error: "TELEGRAM_BOT_TOKEN missing" }, 500);
  if (!WEBHOOK_SECRET)
    return jsonResponse({ error: "TELEGRAM_WEBHOOK_SECRET missing" }, 500);

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      secret_token: WEBHOOK_SECRET,
      allowed_updates: ["message"],
      drop_pending_updates: true,
    }),
  });
  const body = await res.json().catch(() => ({}));
  return jsonResponse({ ok: res.ok, url: WEBHOOK_URL, telegram: body }, res.ok ? 200 : 500);
}

async function handleInfo(): Promise<Response> {
  if (!BOT_TOKEN) return jsonResponse({ error: "TELEGRAM_BOT_TOKEN missing" }, 500);
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`,
  );
  const body = await res.json().catch(() => ({}));
  return jsonResponse({ ok: res.ok, telegram: body });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // --- Admin setup / info branch ---
  if (req.method === "GET" && action === "info") {
    const err = await requireAdmin(req);
    if (err) return err;
    return handleInfo();
  }

  if (req.method === "POST") {
    // Try to detect setup call (admin JSON body). Telegram uses secret header.
    const secretHeader = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (!secretHeader) {
      // Not a Telegram update — treat as admin call
      let body: any = null;
      try {
        body = await req.json();
      } catch {
        return jsonResponse({ error: "bad request" }, 400);
      }
      if (body?.action === "setup") {
        const err = await requireAdmin(req);
        if (err) return err;
        return handleSetup();
      }
      if (body?.action === "info") {
        const err = await requireAdmin(req);
        if (err) return err;
        return handleInfo();
      }
      return jsonResponse({ error: "unknown action" }, 400);
    }

    // --- Telegram webhook branch ---
    if (!WEBHOOK_SECRET || secretHeader !== WEBHOOK_SECRET) {
      return jsonResponse({ ok: true });
    }

    let update: any = null;
    try {
      update = await req.json();
    } catch {
      return jsonResponse({ ok: true });
    }

    const message =
      update?.message ?? update?.edited_message ?? update?.channel_post;
    const chatId = message?.chat?.id;
    const text: string | undefined = message?.text;

    if (!chatId || !text) return jsonResponse({ ok: true });

    const cmd = parseCommand(text);
    if (!cmd) return jsonResponse({ ok: true });

    const supabase = serviceClient();
    const { data: chats } = await supabase
      .from("telegram_chat_ids")
      .select("chat_id")
      .eq("active", true);
    const allowed = new Set((chats ?? []).map((c: any) => String(c.chat_id)));
    if (!allowed.has(String(chatId))) {
      await tgSend(chatId, "⛔ Nicht autorisiert.");
      return jsonResponse({ ok: true });
    }

    const active = cmd === "on";
    const { data: updated, error } = await supabase
      .from("panels")
      .update({ active })
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select("id");

    if (error) {
      await tgSend(chatId, `⚠️ Fehler: ${error.message}`);
      return jsonResponse({ ok: true });
    }

    const count = updated?.length ?? 0;
    const reply = active
      ? `🟢 Alle Panels sind jetzt <b>ONLINE</b> (${count} aktiviert).`
      : `🔴 Alle Panels sind jetzt <b>OFFLINE</b> (${count} deaktiviert).`;
    await tgSend(chatId, reply);
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ ok: true });
});
