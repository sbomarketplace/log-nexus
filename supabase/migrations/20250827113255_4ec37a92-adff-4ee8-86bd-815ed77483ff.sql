-- Keep RLS on incidents table
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Create a simplified RPC that returns only safe fields for shared incidents
-- Since there's no share_slug column, we'll use the incident ID for sharing
CREATE OR REPLACE FUNCTION public.get_shared_incident(p_incident_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  created_at timestamptz,
  case_number text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT i.id, i.title, i.created_at, i.case_number
  FROM public.incidents i
  WHERE i.is_shared = true
    AND i.id = p_incident_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shared_incident(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_shared_incident(uuid) TO anon, authenticated;