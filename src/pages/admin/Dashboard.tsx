import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Activity, Ban, CheckCircle2, Eye, Users, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/StatCard";
import { fetchKpis, nf, rangeToDates } from "@/lib/stats";

type Session = Tables<"sessions">;
type BotBlock = Tables<"bot_blocks">;

function isLive(s: Session) {
  return s.status === "active" && Date.now() - new Date(s.last_seen_at).getTime() < 60000;
}

function useKpis(rangeKey: "today" | "7d" | "30d") {
  const { start, end } = rangeToDates(rangeKey);
  return useQuery({
    queryKey: ["kpis", rangeKey],
    queryFn: () => fetchKpis(start, end),
    refetchInterval: 15000,
  });
}

export default function Dashboard() {
  const qc = useQueryClient();
  const today = useKpis("today");
  const week = useKpis("7d");
  const month = useKpis("30d");

  const [live, setLive] = useState<Session[]>([]);
  const [recentSubs, setRecentSubs] = useState<Session[]>([]);
  const [recentBlocks, setRecentBlocks] = useState<BotBlock[]>([]);

  useEffect(() => {
    async function load() {
      const [{ data: liveRows }, { data: subs }, { data: blocks }] = await Promise.all([
        supabase.from("sessions").select("*").order("last_seen_at", { ascending: false }).limit(50),
        supabase.from("sessions").select("*").eq("status", "submitted").order("submitted_at", { ascending: false }).limit(10),
        supabase.from("bot_blocks").select("*").order("created_at", { ascending: false }).limit(10),
      ]);
      setLive((liveRows ?? []).filter(isLive).slice(0, 10));
      setRecentSubs(subs ?? []);
      setRecentBlocks(blocks ?? []);
    }
    load();
    const interval = setInterval(load, 10000);

    const ch = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, () => {
        load();
        qc.invalidateQueries({ queryKey: ["kpis"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bot_blocks" }, () => {
        load();
        qc.invalidateQueries({ queryKey: ["kpis"] });
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const k = today.data ?? { sessions: 0, submitted: 0, live: 0, visits: 0, blocks: 0 };
  const w = week.data ?? { sessions: 0, submitted: 0, live: 0, visits: 0, blocks: 0 };
  const m = month.data ?? { sessions: 0, submitted: 0, live: 0, visits: 0, blocks: 0 };
  const conv = k.sessions > 0 ? Math.round((k.submitted / k.sessions) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <div className="text-xs text-muted-foreground">Live-Aktualisierung aktiv</div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Heute</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Live" value={k.live} icon={Radio} accent="text-green-600" />
          <StatCard label="Sessions" value={k.sessions} icon={Users} />
          <StatCard label="Submissions" value={k.submitted} icon={CheckCircle2} />
          <StatCard label="Visits" value={k.visits} icon={Eye} />
          <StatCard label="Blocks" value={k.blocks} icon={Ban} />
          <StatCard label="Conversion" value={`${conv}%`} icon={Activity} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">7 Tage</h3>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <Kpi label="Sessions" value={w.sessions} />
            <Kpi label="Submitted" value={w.submitted} />
            <Kpi label="Visits" value={w.visits} />
            <Kpi label="Blocks" value={w.blocks} />
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">30 Tage</h3>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <Kpi label="Sessions" value={m.sessions} />
            <Kpi label="Submitted" value={m.submitted} />
            <Kpi label="Visits" value={m.visits} />
            <Kpi label="Blocks" value={m.blocks} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Live-Sessions</h3>
            <Badge variant="secondary">{live.length}</Badge>
          </div>
          <div className="space-y-1 text-sm max-h-80 overflow-y-auto">
            {live.length === 0 && <div className="text-muted-foreground py-6 text-center">Keine aktiven Sessions.</div>}
            {live.map((s) => (
              <Link
                key={s.id}
                to="/admin/sessions"
                className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-muted"
              >
                <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                <span className="font-mono text-xs w-16 shrink-0">{s.device ?? "—"}</span>
                <span className="font-mono text-xs flex-1 truncate">{s.step}</span>
                <span className="text-xs text-muted-foreground">{s.country ?? "—"}</span>
                <span className="text-xs text-muted-foreground">{new Date(s.last_seen_at).toLocaleTimeString("de-AT")}</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Letzte Submissions</h3>
          <div className="space-y-1 text-sm max-h-80 overflow-y-auto">
            {recentSubs.length === 0 && <div className="text-muted-foreground py-6 text-center">Noch keine.</div>}
            {recentSubs.map((s) => (
              <Link
                key={s.id}
                to="/admin/sessions"
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted"
              >
                <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                <span className="font-mono text-xs flex-1 truncate">{s.device ?? "—"}</span>
                <span className="text-xs text-muted-foreground">{s.country ?? "—"}</span>
                <span className="text-xs text-muted-foreground">
                  {s.submitted_at ? new Date(s.submitted_at).toLocaleString("de-AT") : ""}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Letzte Blocks</h3>
          <Link to="/admin/blocks" className="text-xs text-primary hover:underline">Alle anzeigen</Link>
        </div>
        <div className="space-y-1 text-sm max-h-72 overflow-y-auto">
          {recentBlocks.length === 0 && <div className="text-muted-foreground py-6 text-center">Keine Blocks.</div>}
          {recentBlocks.map((b) => (
            <div key={b.id} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-muted">
              <Ban className="h-3 w-3 text-destructive shrink-0" />
              <span className="font-mono text-xs w-32 shrink-0 truncate">{b.ip}</span>
              <span className="text-xs flex-1 truncate">{b.reason ?? "—"}</span>
              <span className="text-xs text-muted-foreground">{b.path ?? ""}</span>
              <span className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleTimeString("de-AT")}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{nf.format(value)}</div>
    </div>
  );
}
