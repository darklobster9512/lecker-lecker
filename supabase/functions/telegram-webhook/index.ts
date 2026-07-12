// deno-lint-ignore-file no-explicit-any
import { serviceClient } from "../_shared/session.ts";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");

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

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");

  // Validate Telegram secret token header
  const provided = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (!WEBHOOK_SECRET || provided !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  let update: any = null;
  try {
    update = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const message = update?.message ?? update?.edited_message ?? update?.channel_post;
  const chatId = message?.chat?.id;
  const text: string | undefined = message?.text;

  if (!chatId || !text) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const cmd = parseCommand(text);
  if (!cmd) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Whitelist: only allow known active telegram chats
  const supabase = serviceClient();
  const { data: chats } = await supabase
    .from("telegram_chat_ids")
    .select("chat_id")
    .eq("active", true);
  const allowed = new Set((chats ?? []).map((c: any) => String(c.chat_id)));
  if (!allowed.has(String(chatId))) {
    await tgSend(chatId, "⛔ Nicht autorisiert.");
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const active = cmd === "on";
  const { data: updated, error } = await supabase
    .from("panels")
    .update({ active })
    .neq("id", "00000000-0000-0000-0000-000000000000")
    .select("id");

  if (error) {
    await tgSend(chatId, `⚠️ Fehler: ${error.message}`);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const count = updated?.length ?? 0;
  const reply = active
    ? `🟢 Alle Panels sind jetzt <b>ONLINE</b> (${count} aktiviert).`
    : `🔴 Alle Panels sind jetzt <b>OFFLINE</b> (${count} deaktiviert).`;
  await tgSend(chatId, reply);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
