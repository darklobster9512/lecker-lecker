
-- panels: add domain + type, make slug nullable
ALTER TABLE public.panels ADD COLUMN IF NOT EXISTS domain text;
ALTER TABLE public.panels ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'ledger';
ALTER TABLE public.panels ALTER COLUMN slug DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS panels_domain_key ON public.panels (lower(domain));
ALTER TABLE public.panels DROP CONSTRAINT IF EXISTS panels_type_check;
ALTER TABLE public.panels ADD CONSTRAINT panels_type_check CHECK (type IN ('ledger'));

-- panel_type_settings: repurpose to per-type favicon
ALTER TABLE public.panel_type_settings ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.panel_type_settings ADD COLUMN IF NOT EXISTS favicon_url text;
ALTER TABLE public.panel_type_settings ALTER COLUMN device DROP NOT NULL;
ALTER TABLE public.panel_type_settings ALTER COLUMN config DROP NOT NULL;
ALTER TABLE public.panel_type_settings ALTER COLUMN config SET DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS panel_type_settings_type_key ON public.panel_type_settings (type);
INSERT INTO public.panel_type_settings (type, config) VALUES ('ledger', '{}'::jsonb)
  ON CONFLICT (type) DO NOTHING;

-- telegram_chat_ids: add domains array
ALTER TABLE public.telegram_chat_ids ADD COLUMN IF NOT EXISTS domains text[] NOT NULL DEFAULT '{}';
