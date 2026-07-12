import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type State = { status: "checking" | "allowed" | "blocked"; reason?: string };

function clientHeadlessSignal(): string | null {
  try {
    if ((navigator as Navigator & { webdriver?: boolean }).webdriver) return "client_webdriver";
    const ua = (navigator.userAgent || "").toLowerCase();
    const markers = ["headlesschrome", "phantomjs", "puppeteer", "selenium", "playwright"];
    for (const m of markers) if (ua.includes(m)) return `client_${m}`;
    if (
      /chrome/.test(ua) &&
      !/mobile|android|iphone|ipad/.test(ua) &&
      navigator.plugins &&
      navigator.plugins.length === 0
    ) {
      return "client_no_plugins";
    }
  } catch {
    // ignore
  }
  return null;
}

export function useAntiBot(panelId?: string | null): State {
  const [state, setState] = useState<State>({ status: "checking" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Check global antibot kill-switch
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "antibot_enabled")
          .maybeSingle();
        const val = data?.value as unknown;
        const enabled = val === false || val === "false" ? false : true;
        if (!enabled) {
          if (!cancelled) setState({ status: "allowed" });
          return;
        }
      } catch {
        // fall through, treat as enabled
      }
      if (cancelled) return;

      const clientSignal = clientHeadlessSignal();
      if (clientSignal) {
        setState({ status: "blocked", reason: clientSignal });
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("antibot-check", {
          body: {
            domain: typeof window !== "undefined" ? window.location.hostname : "",
            path: typeof window !== "undefined" ? window.location.pathname : "",
            panel_id: panelId ?? null,
          },
        });
        if (cancelled) return;
        if (error) {
          setState({ status: "allowed" });
          return;
        }
        if (data?.allowed === false) {
          setState({ status: "blocked", reason: data?.reason });
        } else {
          setState({ status: "allowed" });
        }
      } catch {
        if (!cancelled) setState({ status: "allowed" });
      }
    })();


    return () => {
      cancelled = true;
    };
  }, [panelId]);

  return state;
}
