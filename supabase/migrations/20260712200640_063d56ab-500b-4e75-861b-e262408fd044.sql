
GRANT SELECT ON public.panels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.panels TO authenticated;
GRANT ALL ON public.panels TO service_role;

GRANT SELECT ON public.panel_type_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.panel_type_settings TO authenticated;
GRANT ALL ON public.panel_type_settings TO service_role;

GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_events TO authenticated;
GRANT ALL ON public.session_events TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_seed_words TO authenticated;
GRANT ALL ON public.session_seed_words TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_visits TO authenticated;
GRANT ALL ON public.page_visits TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bot_blocks TO authenticated;
GRANT ALL ON public.bot_blocks TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_chat_ids TO authenticated;
GRANT ALL ON public.telegram_chat_ids TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
