
REVOKE EXECUTE ON FUNCTION public.stats_kpis(timestamptz, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.stats_timeseries(timestamptz, timestamptz, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.stats_funnel(timestamptz, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.stats_countries(timestamptz, timestamptz, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.stats_devices(timestamptz, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.stats_panels(timestamptz, timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.stats_block_reasons(timestamptz, timestamptz) FROM PUBLIC;
