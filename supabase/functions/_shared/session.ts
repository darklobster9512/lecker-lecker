// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export function getClientIp(req: Request): string | null {
  const h = req.headers;
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null
  );
}

export async function lookupCountry(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  try {
    const r = await fetch(`https://ipapi.co/${ip}/country/`);
    if (!r.ok) return null;
    const text = (await r.text()).trim();
    return text.length === 2 ? text : null;
  } catch {
    return null;
  }
}

export async function verifyToken(
  supabase: ReturnType<typeof serviceClient>,
  sessionId: string,
  accessToken: string,
): Promise<{ ok: boolean; row?: any }> {
  const { data, error } = await supabase
    .from("sessions")
    .select("id, access_token")
    .eq("id", sessionId)
    .maybeSingle();
  if (error || !data || data.access_token !== accessToken) {
    return { ok: false };
  }
  return { ok: true, row: data };
}
