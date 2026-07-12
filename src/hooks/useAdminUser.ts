import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AdminUserState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
};

export function useAdminUser(): AdminUserState {
  const [state, setState] = useState<AdminUserState>({
    loading: true,
    session: null,
    user: null,
    isAdmin: false,
  });

  useEffect(() => {
    let mounted = true;

    async function loadRole(user: User | null, session: Session | null) {
      if (!user) {
        if (mounted) setState({ loading: false, session: null, user: null, isAdmin: false });
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (mounted) {
        setState({ loading: false, session, user, isAdmin: !!data });
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      loadRole(session?.user ?? null, session);
    });

    supabase.auth.getSession().then(({ data }) => {
      loadRole(data.session?.user ?? null, data.session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
