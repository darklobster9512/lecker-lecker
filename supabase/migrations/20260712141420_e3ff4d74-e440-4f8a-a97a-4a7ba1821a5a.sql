
-- Enable realtime on sessions and bot_blocks
ALTER TABLE public.sessions REPLICA IDENTITY FULL;
ALTER TABLE public.bot_blocks REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bot_blocks;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- KPI aggregates
CREATE OR REPLACE FUNCTION public.stats_kpis(range_start timestamptz, range_end timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT jsonb_build_object(
    'sessions', (SELECT count(*) FROM sessions WHERE created_at >= range_start AND created_at < range_end),
    'submitted', (SELECT count(*) FROM sessions WHERE status = 'submitted' AND submitted_at >= range_start AND submitted_at < range_end),
    'live', (SELECT count(*) FROM sessions WHERE status = 'active' AND last_seen_at > now() - interval '60 seconds'),
    'visits', (SELECT count(*) FROM page_visits WHERE created_at >= range_start AND created_at < range_end),
    'blocks', (SELECT count(*) FROM bot_blocks WHERE created_at >= range_start AND created_at < range_end)
  ) INTO result;
  RETURN result;
END;
$$;

-- Timeseries
CREATE OR REPLACE FUNCTION public.stats_timeseries(range_start timestamptz, range_end timestamptz, bucket text)
RETURNS TABLE(bucket_ts timestamptz, sessions bigint, visits bigint, blocks bigint, submissions bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trunc_unit text;
  step interval;
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
END;
$$;

-- Funnel
CREATE OR REPLACE FUNCTION public.stats_funnel(range_start timestamptz, range_end timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN '{}'::jsonb; END IF;

  RETURN jsonb_build_object(
    'visits', (SELECT count(*) FROM page_visits WHERE created_at >= range_start AND created_at < range_end),
    'sessions', (SELECT count(*) FROM sessions WHERE created_at >= range_start AND created_at < range_end),
    'device_selected', (SELECT count(*) FROM sessions WHERE created_at >= range_start AND created_at < range_end AND device IS NOT NULL),
    'seed_started', (SELECT count(*) FROM sessions WHERE created_at >= range_start AND created_at < range_end AND step LIKE 'seed%'),
    'submitted', (SELECT count(*) FROM sessions WHERE status='submitted' AND submitted_at >= range_start AND submitted_at < range_end)
  );
END;
$$;

-- Top countries
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

-- Devices
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

-- Panels
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

-- Block reasons
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

GRANT EXECUTE ON FUNCTION public.stats_kpis(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stats_timeseries(timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stats_funnel(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stats_countries(timestamptz, timestamptz, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stats_devices(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stats_panels(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stats_block_reasons(timestamptz, timestamptz) TO authenticated;
