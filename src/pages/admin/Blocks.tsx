import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShieldOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface BlockRow {
  id: string;
  ip: string | null;
  user_agent: string | null;
  referer: string | null;
  reason: string;
  domain: string | null;
  path: string | null;
  country: string | null;
  created_at: string;
}

const reasonColor = (reason: string) => {
  if (reason.startsWith("tor")) return "bg-purple-100 text-purple-800";
  if (reason.startsWith("firehol")) return "bg-red-100 text-red-800";
  if (reason.startsWith("ua_pattern") || reason.startsWith("scanner_ua"))
    return "bg-blue-100 text-blue-800";
  if (reason.startsWith("headless") || reason.startsWith("client_"))
    return "bg-orange-100 text-orange-800";
  if (reason.startsWith("referer")) return "bg-yellow-100 text-yellow-800";
  if (reason.startsWith("missing_")) return "bg-gray-200 text-gray-800";
  return "bg-slate-100 text-slate-800";
};

const shortReason = (r: string) => {
  const i = r.indexOf(":");
  return i === -1 ? r : r.slice(0, i);
};

export default function Blocks() {
  const [rows, setRows] = useState<BlockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [antibotEnabled, setAntibotEnabled] = useState<boolean | null>(null);
  const [savingToggle, setSavingToggle] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "antibot_enabled")
        .maybeSingle();
      const v = data?.value as unknown;
      setAntibotEnabled(v === false || v === "false" ? false : true);
    })();
  }, []);

  const toggleAntibot = async (next: boolean) => {
    setSavingToggle(true);
    const prev = antibotEnabled;
    setAntibotEnabled(next);
    const { error } = await supabase
      .from("app_settings")
      .update({ value: next })
      .eq("key", "antibot_enabled");
    setSavingToggle(false);
    if (error) {
      setAntibotEnabled(prev);
      toast.error("Speichern fehlgeschlagen: " + error.message);
    } else {
      toast.success(next ? "Antibot aktiviert" : "Antibot deaktiviert");
    }
  };


  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("bot_blocks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      setRows((data as BlockRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    let today = 0, week = 0, month = 0;
    for (const r of rows) {
      const diff = now - new Date(r.created_at).getTime();
      if (diff <= day) today++;
      if (diff <= 7 * day) week++;
      if (diff <= 30 * day) month++;
    }
    return { total: rows.length, today, week, month };
  }, [rows]);

  const byReason = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = shortReason(r.reason);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const topIps = useMemo(() => {
    const m = new Map<string, { count: number; last: string }>();
    for (const r of rows) {
      if (!r.ip) continue;
      const cur = m.get(r.ip);
      if (cur) {
        cur.count++;
        if (r.created_at > cur.last) cur.last = r.created_at;
      } else {
        m.set(r.ip, { count: 1, last: r.created_at });
      }
    }
    return Array.from(m.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);
  }, [rows]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    const list = f
      ? rows.filter(
          (r) =>
            (r.ip ?? "").toLowerCase().includes(f) ||
            (r.domain ?? "").toLowerCase().includes(f) ||
            (r.reason ?? "").toLowerCase().includes(f) ||
            (r.user_agent ?? "").toLowerCase().includes(f),
        )
      : rows;
    return list.slice(0, 100);
  }, [rows, filter]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldOff className="h-6 w-6 text-red-600" />
        <h1 className="text-2xl font-semibold">Geblockte Requests</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Heute", value: stats.today, color: "text-red-600" },
          { label: "7 Tage", value: stats.week, color: "text-orange-600" },
          { label: "30 Tage", value: stats.month, color: "text-yellow-600" },
          { label: "Gesamt", value: stats.total, color: "" },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Nach Grund</CardTitle></CardHeader>
          <CardContent>
            {byReason.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Blocks.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grund</TableHead>
                    <TableHead className="text-right">Anzahl</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byReason.map(([reason, count]) => (
                    <TableRow key={reason}>
                      <TableCell>
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${reasonColor(reason)}`}>
                          {reason}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top IPs</CardTitle></CardHeader>
          <CardContent>
            {topIps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Blocks.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP</TableHead>
                    <TableHead className="text-right">Blocks</TableHead>
                    <TableHead className="text-right">Zuletzt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topIps.map(([ip, info]) => (
                    <TableRow key={ip}>
                      <TableCell className="font-mono text-xs">{ip}</TableCell>
                      <TableCell className="text-right font-mono">{info.count}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(info.last).toLocaleString("de-DE")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Letzte Blocks ({filtered.length})</CardTitle>
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter IP / Domain / Grund / UA…"
              className="w-72"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Laden…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Einträge.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zeit</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Land</TableHead>
                    <TableHead>Grund</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Pfad</TableHead>
                    <TableHead>User-Agent</TableHead>
                    <TableHead>Referer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("de-DE")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.ip ?? "—"}</TableCell>
                      <TableCell className="text-xs">{r.country ?? "—"}</TableCell>
                      <TableCell>
                        <Badge className={`${reasonColor(r.reason)} border-0`} variant="outline" title={r.reason}>
                          {shortReason(r.reason)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{r.domain ?? "—"}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-xs">{r.path ?? "—"}</TableCell>
                      <TableCell className="max-w-[240px] truncate text-xs" title={r.user_agent ?? ""}>
                        {r.user_agent ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs" title={r.referer ?? ""}>
                        {r.referer ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
