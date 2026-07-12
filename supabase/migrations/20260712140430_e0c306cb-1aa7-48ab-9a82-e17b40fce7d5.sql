ALTER TABLE public.bot_blocks
  ADD COLUMN IF NOT EXISTS referer text,
  ADD COLUMN IF NOT EXISTS domain text,
  ADD COLUMN IF NOT EXISTS path text;