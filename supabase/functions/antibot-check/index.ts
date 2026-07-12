// AntiBot check edge function — ported from FinanzOnline Gateway.
// Validates incoming requests against IP blocklists (FireHOL, Tor),
// crawler User-Agent patterns, headless browser markers, referer blacklist.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

type Cidr = { base: number; mask: number };

interface Cache {
  loadedAt: number;
  cidrs: Cidr[];
  torSet: Set<string>;
  uaPatterns: RegExp[];
}

let cache: Cache | null = null;

const REFERER_BLACKLIST = [
  "phishtank.com", "phishtank.org", "openphish.com", "namecheap.com",
  "virustotal.com", "urlscan.io", "urlquery.net", "urlvoid.com",
  "sucuri.net", "sitecheck.sucuri.net", "fortinet.com", "fortiguard.com",
  "trendmicro.com", "sitesafety.trendmicro.com", "sophos.com",
  "bitdefender.com", "quttera.com", "eset.com", "kaspersky.com",
  "opswat.com", "metadefender.com", "hybrid-analysis.com", "joesandbox.com",
  "any.run", "ipqualityscore.com", "abuse.ch", "phishcheck.me",
  "netcraft.com", "report.netcraft.com", "scanurl.net", "isitphishing.org",
  "checkphish.ai", "threatbook.io", "webinspector.com", "browserling.com",
  "browserstack.com", "saucelabs.com", "archive.org", "web.archive.org",
  "cachedview.com", "google.com/safebrowsing", "safebrowsing.google.com",
  "transparencyreport.google.com",
];

const SCANNER_UA_MARKERS = [
  "urlscan", "sucuri", "fortinet", "trendmicro", "sophos", "bitdefender",
  "kaspersky", "eset", "netcraft", "phishtank", "openphish", "safebrowsing",
  "googlebot-safety", "smartscreen", "msnbot-media", "bingpreview",
  "slackbot", "twitterbot", "discordbot", "telegrambot", "whatsapp",
  "facebookexternalhit", "linkedinbot", "skypeuripreview", "pinterest",
  "applebot", "duckduckbot", "yandex", "baiduspider", "mj12bot",
  "ahrefsbot", "semrushbot", "dotbot", "rogerbot", "screaming frog",
  "python-requests", "curl/", "wget", "go-http-client", "java/",
  "okhttp", "aiohttp", "node-fetch", "axios",
];

const HEADLESS_MARKERS = [
  "headlesschrome", "phantomjs", "puppeteer", "selenium",
  "playwright", "electron", "slimerjs", "htmlunit",
];

const IP_SOURCES = [
  "https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/firehol_level1.netset",
  "https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/firehol_webclient.netset",
  "https://raw.githubusercontent.com/lord-alfred/ipranges/main/all/ipv4.txt",
];
const TOR_SOURCE = "https://check.torproject.org/torbulkexitlist";
const UA_SOURCE =
  "https://raw.githubusercontent.com/monperrus/crawler-user-agents/master/crawler-user-agents.json";

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = (n << 8) + v;
  }
  return n >>> 0;
}

function parseCidr(line: string): Cidr | null {
  const cleaned = line.split("#")[0].trim();
  if (!cleaned) return null;
  let ip = cleaned;
  let bits = 32;
  if (cleaned.includes("/")) {
    const [a, b] = cleaned.split("/");
    ip = a;
    bits = Number(b);
    if (!Number.isInteger(bits) || bits < 0 || bits > 32) return null;
  }
  const base = ipv4ToInt(ip);
  if (base === null) return null;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return { base: (base & mask) >>> 0, mask };
}

function ipMatchesCidrs(ipInt: number, cidrs: Cidr[]): boolean {
  for (const c of cidrs) {
    if (((ipInt & c.mask) >>> 0) === c.base) return true;
  }
  return false;
}

async function loadLists(): Promise<Cache> {
  const cidrs: Cidr[] = [];
  for (const url of IP_SOURCES) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const text = await res.text();
      for (const line of text.split(/\r?\n/)) {
        const c = parseCidr(line);
        if (c) cidrs.push(c);
      }
    } catch (e) {
      console.error("Failed to load IP source", url, e);
    }
  }

  const torSet = new Set<string>();
  try {
    const res = await fetch(TOR_SOURCE);
    if (res.ok) {
      const text = await res.text();
      for (const line of text.split(/\r?\n/)) {
        const ip = line.trim();
        if (ip && !ip.startsWith("#")) torSet.add(ip);
      }
    }
  } catch (e) {
    console.error("Failed to load tor list", e);
  }

  const uaPatterns: RegExp[] = [];
  try {
    const res = await fetch(UA_SOURCE);
    if (res.ok) {
      const json = await res.json();
      for (const entry of json) {
        if (entry?.pattern) {
          try {
            uaPatterns.push(new RegExp(entry.pattern, "i"));
          } catch {
            // skip invalid regex
          }
        }
      }
    }
  } catch (e) {
    console.error("Failed to load UA list", e);
  }

  return { loadedAt: Date.now(), cidrs, torSet, uaPatterns };
}

async function getCache(): Promise<Cache> {
  if (!cache || Date.now() - cache.loadedAt > CACHE_TTL_MS) {
    cache = await loadLists();
  }
  return cache;
}

function extractIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  const first = xff.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || "";
}

async function lookupCountry(ip: string | null): Promise<string | null> {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const domain: string = (body?.domain || "").toString().slice(0, 255);
    const path: string = (body?.path || "").toString().slice(0, 500);
    const panelId: string | null = body?.panel_id ?? null;
    const ua: string = (req.headers.get("user-agent") || "").toLowerCase();
    const referer = req.headers.get("referer") || "";
    const acceptLanguage = req.headers.get("accept-language") || "";
    const ip = extractIp(req);

    // Global kill-switch
    if (!(await isAntibotEnabled())) {
      return new Response(
        JSON.stringify({ allowed: true, disabled: true, ip }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const lists = await getCache();

    let reason: string | null = null;

    // 1) Headless markers
    for (const m of HEADLESS_MARKERS) {
      if (ua.includes(m)) { reason = `headless:${m}`; break; }
    }

    // 1b) Scanner UA markers
    if (!reason && ua) {
      for (const m of SCANNER_UA_MARKERS) {
        if (ua.includes(m)) { reason = `scanner_ua:${m}`; break; }
      }
    }

    // 1c) Missing accept-language
    if (!reason && !acceptLanguage) {
      reason = "missing_accept_language";
    }

    // 2) Referer blacklist
    if (!reason && referer) {
      try {
        const host = new URL(referer).hostname.toLowerCase();
        for (const bad of REFERER_BLACKLIST) {
          if (host === bad || host.endsWith("." + bad) || host.includes(bad)) {
            reason = `referer:${bad}`;
            break;
          }
        }
      } catch { /* invalid referer URL */ }
    }

    // 3) Tor exit nodes
    if (!reason && ip && lists.torSet.has(ip)) reason = "tor";

    // 4) IP CIDR blocklist
    if (!reason && ip) {
      const ipInt = ipv4ToInt(ip);
      if (ipInt !== null && ipMatchesCidrs(ipInt, lists.cidrs)) {
        reason = "firehol_cidr";
      }
    }

    // 5) Crawler user-agent patterns
    if (!reason && ua) {
      for (const re of lists.uaPatterns) {
        if (re.test(ua)) {
          reason = `ua_pattern:${re.source.slice(0, 60)}`;
          break;
        }
      }
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const country = await lookupCountry(ip || null);

    if (reason) {
      try {
        await admin.from("bot_blocks").insert({
          ip: ip || null,
          user_agent: ua || null,
          referer: referer || null,
          reason,
          domain: domain || null,
          path: path || null,
          country,
        });
      } catch (e) {
        console.error("Failed to insert bot_block log", e);
      }

      return new Response(
        JSON.stringify({ allowed: false, reason, ip }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Log allowed visit
    try {
      await admin.from("page_visits").insert({
        panel_id: panelId,
        path: path || "/",
        ip: ip || null,
        country,
        user_agent: ua || null,
        referrer: referer || null,
      });
    } catch (e) {
      console.error("Failed to insert page_visit", e);
    }

    return new Response(JSON.stringify({ allowed: true, ip }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("antibot-check error", e);
    return new Response(JSON.stringify({ allowed: true, error: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
