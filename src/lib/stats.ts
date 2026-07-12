import { supabase } from "@/integrations/supabase/client";

export type RangeKey = "today" | "7d" | "30d" | "90d";

export function rangeToDates(key: RangeKey): { start: Date; end: Date; bucket: "hour" | "day" } {
  const end = new Date();
  const start = new Date(end);
  let bucket: "hour" | "day" = "day";
  switch (key) {
    case "today":
      start.setHours(0, 0, 0, 0);
      bucket = "hour";
      break;
    case "7d":
      start.setDate(end.getDate() - 7);
      bucket = "day";
      break;
    case "30d":
      start.setDate(end.getDate() - 30);
      bucket = "day";
      break;
    case "90d":
      start.setDate(end.getDate() - 90);
      bucket = "day";
      break;
  }
  return { start, end, bucket };
}

export type Kpis = {
  sessions: number;
  submitted: number;
  live: number;
  visits: number;
  blocks: number;
};

export async function fetchKpis(start: Date, end: Date): Promise<Kpis> {
  const { data, error } = await supabase.rpc("stats_kpis", {
    range_start: start.toISOString(),
    range_end: end.toISOString(),
  });
  if (error) throw error;
  return (data as unknown as Kpis) ?? { sessions: 0, submitted: 0, live: 0, visits: 0, blocks: 0 };
}

export async function fetchTimeseries(start: Date, end: Date, bucket: "hour" | "day") {
  const { data, error } = await supabase.rpc("stats_timeseries", {
    range_start: start.toISOString(),
    range_end: end.toISOString(),
    bucket,
  });
  if (error) throw error;
  return (data ?? []) as Array<{
    bucket_ts: string;
    sessions: number;
    visits: number;
    blocks: number;
    submissions: number;
  }>;
}

export async function fetchFunnel(start: Date, end: Date) {
  const { data, error } = await supabase.rpc("stats_funnel", {
    range_start: start.toISOString(),
    range_end: end.toISOString(),
  });
  if (error) throw error;
  return (data as unknown as {
    visits: number;
    sessions: number;
    device_selected: number;
    seed_started: number;
    submitted: number;
  }) ?? { visits: 0, sessions: 0, device_selected: 0, seed_started: 0, submitted: 0 };
}

export async function fetchCountries(start: Date, end: Date, topN = 10) {
  const { data, error } = await supabase.rpc("stats_countries", {
    range_start: start.toISOString(),
    range_end: end.toISOString(),
    top_n: topN,
  });
  if (error) throw error;
  return (data ?? []) as Array<{ country: string; cnt: number }>;
}

export async function fetchDevices(start: Date, end: Date) {
  const { data, error } = await supabase.rpc("stats_devices", {
    range_start: start.toISOString(),
    range_end: end.toISOString(),
  });
  if (error) throw error;
  return (data ?? []) as Array<{ device: string; cnt: number }>;
}

export async function fetchPanels(start: Date, end: Date) {
  const { data, error } = await supabase.rpc("stats_panels", {
    range_start: start.toISOString(),
    range_end: end.toISOString(),
  });
  if (error) throw error;
  return (data ?? []) as Array<{ slug: string; sessions: number; submissions: number }>;
}

export async function fetchBlockReasons(start: Date, end: Date) {
  const { data, error } = await supabase.rpc("stats_block_reasons", {
    range_start: start.toISOString(),
    range_end: end.toISOString(),
  });
  if (error) throw error;
  return (data ?? []) as Array<{ reason: string; cnt: number }>;
}

export const nf = new Intl.NumberFormat("de-AT");
