
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_sessions_hidden_last_seen ON public.sessions (hidden, last_seen_at DESC);
