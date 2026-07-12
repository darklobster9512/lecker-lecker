import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, ExternalLink, Send, Webhook } from "lucide-react";

type ChatRow = Tables<"telegram_chat_ids">;

export default function Telegram() {
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [chatId, setChatId] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  async function sendTest() {
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("notify-telegram", {
      body: { test: true },
    });
    setTesting(false);
    if (error) return toast.error(error.message);
    const sent = data?.sent ?? 0;
    const failed = data?.failed ?? 0;
    if (sent > 0 && failed === 0) toast.success(`Testnachricht gesendet an ${sent} Chat(s)`);
    else if (sent > 0) toast.warning(`Gesendet: ${sent}, Fehler: ${failed}`);
    else toast.error(`Fehlgeschlagen. ${(data?.errors ?? []).join("; ") || "Keine aktiven Chats?"}`);
  }

  async function load() {
    const { data, error } = await supabase
      .from("telegram_chat_ids")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows(data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!chatId.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("telegram_chat_ids").insert({
      chat_id: chatId.trim(),
      label: label.trim() || null,
      active: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    setChatId("");
    setLabel("");
    toast.success("Chat hinzugefügt");
    load();
  }

  async function toggle(row: ChatRow) {
    const { error } = await supabase
      .from("telegram_chat_ids")
      .update({ active: !row.active })
      .eq("id", row.id);
    if (error) toast.error(error.message);
    else load();
  }

  async function remove(row: ChatRow) {
    if (!confirm(`Chat "${row.label || row.chat_id}" löschen?`)) return;
    const { error } = await supabase.from("telegram_chat_ids").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Gelöscht");
      load();
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Telegram-Benachrichtigungen</h2>
          <p className="text-sm text-muted-foreground">
            Chat-IDs, an die bei jedem Seed-Submit eine Nachricht gesendet wird.
          </p>
        </div>
        <Button onClick={sendTest} disabled={testing} variant="outline">
          <Send className="h-4 w-4 mr-2" />
          {testing ? "Sende…" : "Testnachricht senden"}
        </Button>
      </div>

      <Card className="p-4 bg-muted/30 text-sm space-y-2">
        <div className="font-semibold">So richtest du es ein:</div>
        <ol className="list-decimal ml-5 space-y-1 text-muted-foreground">
          <li>Erstelle einen Bot via <a className="underline inline-flex items-center gap-1" href="https://t.me/BotFather" target="_blank" rel="noreferrer">@BotFather <ExternalLink className="h-3 w-3" /></a> und speichere das Token als <code>TELEGRAM_BOT_TOKEN</code>.</li>
          <li>Schreibe deinem Bot eine Nachricht (oder füge ihn einer Gruppe hinzu).</li>
          <li>Öffne <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code>, kopiere die <code>chat.id</code>.</li>
          <li>Füge sie unten hinzu.</li>
        </ol>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Neuen Chat hinzufügen</h3>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
          <div>
            <Label>Chat-ID</Label>
            <Input value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="z. B. 123456789 oder -1001234567890" />
          </div>
          <div>
            <Label>Label (optional)</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Team-Gruppe" />
          </div>
          <Button onClick={add} disabled={saving || !chatId.trim()}>Hinzufügen</Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3">Label</th>
              <th className="p-3">Chat-ID</th>
              <th className="p-3">Aktiv</th>
              <th className="p-3">Hinzugefügt</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.label || <span className="text-muted-foreground">—</span>}</td>
                <td className="p-3 font-mono text-xs">{r.chat_id}</td>
                <td className="p-3">
                  <Switch checked={r.active} onCheckedChange={() => toggle(r)} />
                </td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => remove(r)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">Noch keine Chats.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
