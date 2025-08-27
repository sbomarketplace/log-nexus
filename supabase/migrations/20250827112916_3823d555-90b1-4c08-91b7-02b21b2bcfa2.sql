-- Keep RLS on and remove broad public select policy
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS incidents_select_shared ON public.incidents;

-- Minimal RPC that returns only safe fields by slug
CREATE OR REPLACE FUNCTION public.get_shared_incident(p_slug text)
RETURNS TABLE (
  id uuid,
  title text,
  occurred_on date,
  summary text,
  share_slug text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT i.id, i.title, i.occurred_on, i.summary, i.share_slug
  FROM public.incidents i
  WHERE i.is_shared = true
    AND i.share_slug = p_slug
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shared_incident(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_shared_incident(text) TO anon, authenticated;