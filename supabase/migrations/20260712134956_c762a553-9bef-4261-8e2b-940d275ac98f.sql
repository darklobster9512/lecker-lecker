-- Grants for panels: anon can read (RLS restricts to active), authenticated full access via policies, service_role for edge functions
GRANT SELECT ON public.panels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.panels TO authenticated;
GRANT ALL ON public.panels TO service_role;

-- Grants for page_visits: only service_role writes; authenticated (admin) reads via policy
GRANT SELECT ON public.page_visits TO authenticated;
GRANT ALL ON public.page_visits TO service_role;