import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { RangePicker } from "@/components/admin/RangePicker";
import {
  fetchBlockReasons,
  fetchCountries,
  fetchDevices,
  fetchFunnel,
  fetchPanels,
  fetchTimeseries,
  nf,
  rangeToDates,
  type RangeKey,
} from "@/lib/stats";

const COLORS = ["hsl(var(--primary))", "#22c55e", "#f97316", "#8b5cf6", "#06b6d4", "#eab308", "#ec4899", "#64748b"];

export default function Stats() {
  const [range, setRange] = useState<RangeKey>("7d");
  const { start, end, bucket } = useMemo(() => rangeToDates(range), [range]);
  const dep = [start.toISOString(), end.toISOString()] as const;

  const ts = useQuery({ queryKey: ["ts", ...dep, bucket], queryFn: () => fetchTimeseries(start, end, bucket) });
  const funnel = useQuery({ queryKey: ["funnel", ...dep], queryFn: () => fetchFunnel(start, end) });
  const countries = useQuery({ queryKey: ["countries", ...dep], queryFn: () => fetchCountries(start, end, 10) });
  const devices = useQuery({ queryKey: ["devices", ...dep], queryFn: () => fetchDevices(start, end) });
  const panels = useQuery({ queryKey: ["panels", ...dep], queryFn: () => fetchPanels(start, end) });
  const reasons = useQuery({ queryKey: ["reasons", ...dep], queryFn: () => fetchBlockReasons(start, end) });

  const tsData = (ts.data ?? []).map((r) => ({
    ...r,
    label: new Date(r.bucket_ts).toLocaleString("de-AT", bucket === "hour" ? { hour: "2-digit" } : { day: "2-digit", month: "2-digit" }),
  }));

  const f = funnel.data ?? { visits: 0, sessions: 0, device_selected: 0, seed_started: 0, submitted: 0 };
  const funnelData = [
    { name: "Visits", value: f.visits },
    { name: "Sessions", value: f.sessions },
    { name: "Device", value: f.device_selected },
    { name: "Seed", value: f.seed_started },
    { name: "Submitted", value: f.submitted },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-semibold">Statistiken</h2>
        <RangePicker value={range} onChange={setRange} />
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Zeitreihe ({bucket === "hour" ? "stündlich" : "täglich"})</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={tsData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Area type="monotone" dataKey="visits" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} name="Visits" />
              <Area type="monotone" dataKey="sessions" stackId="2" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} name="Sessions" />
              <Area type="monotone" dataKey="submissions" stackId="3" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} name="Submissions" />
              <Area type="monotone" dataKey="blocks" stackId="4" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Blocks" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Conversion-Funnel</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" fontSize={11} width={80} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Geräte</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={devices.data ?? []}
                  dataKey="cnt"
                  nameKey="device"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  label={(e) => `${e.device}: ${e.cnt}`}
                >
                  {(devices.data ?? []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Top Länder</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countries.data ?? []} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="country" fontSize={11} width={60} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="cnt" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Block-Gründe</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasons.data ?? []} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="reason" fontSize={10} width={130} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="cnt" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Panels-Vergleich</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={panels.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="slug" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Bar dataKey="sessions" fill="hsl(var(--primary))" name="Sessions" radius={[4, 4, 0, 0]} />
              <Bar dataKey="submissions" fill="#22c55e" name="Submissions" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="text-xs text-muted-foreground">
        Zeitraum: {start.toLocaleString("de-AT")} – {end.toLocaleString("de-AT")} · {nf.format((ts.data ?? []).length)} Datenpunkte
      </div>
    </div>
  );
}
