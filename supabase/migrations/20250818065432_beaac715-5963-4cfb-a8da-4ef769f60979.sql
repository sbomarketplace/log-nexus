-- Harden incidents table security - require auth for ALL operations
-- Remove anonymous read access and implement explicit sharing

-- Drop existing permissive policies that allow anonymous access
DROP POLICY IF EXISTS incidents_select_shared ON public.incidents;
DROP POLICY IF EXISTS incidents_public_read ON public.incidents;
DROP POLICY IF EXISTS incidents_public_select ON public.incidents;
DROP POLICY IF EXISTS incidents_public_any ON public.incidents;

-- Drop existing policies to replace with hardened versions
DROP POLICY IF EXISTS incidents_select_own ON public.incidents;
DROP POLICY IF EXISTS incidents_insert_own ON public.incidents;
DROP POLICY IF EXISTS incidents_update_own ON public.incidents;
DROP POLICY IF EXISTS incidents_delete_own ON public.incidents;

-- CREATE HARDENED AUTH-REQUIRED POLICIES

-- SELECT: owner or explicitly shared to the current user
CREATE POLICY incidents_select_auth
ON public.incidents
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.incident_shares s
      WHERE s.incident_id = incidents.id
        AND s.shared_with = auth.uid()
        AND (s.expires_at IS NULL OR s.expires_at > now())
    )
  )
);

-- INSERT: only for yourself
CREATE POLICY incidents_insert_auth
ON public.incidents
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND owner_id = auth.uid()
);

-- UPDATE: only owner
CREATE POLICY incidents_update_auth
ON public.incidents
FOR UPDATE
USING (auth.uid() IS NOT NULL AND owner_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- DELETE: only owner
CREATE POLICY incidents_delete_auth
ON public.incidents
FOR DELETE
USING (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- Tighten schema defaults
ALTER TABLE public.incidents
  ALTER COLUMN is_shared SET DEFAULT false;

-- Create explicit sharing system (no anonymous access)
CREATE TABLE IF NOT EXISTS public.incident_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  shared_with uuid NOT NULL,
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on sharing table
ALTER TABLE public.incident_shares ENABLE ROW LEVEL SECURITY;

-- Shares are only visible to owner and recipients
DROP POLICY IF EXISTS shares_select ON public.incident_shares;
CREATE POLICY shares_select
ON public.incident_shares
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = incident_shares.incident_id AND i.owner_id = auth.uid())
    OR shared_with = auth.uid()
  )
);

-- Only owners can INSERT share rows
DROP POLICY IF EXISTS shares_insert ON public.incident_shares;
CREATE POLICY shares_insert
ON public.incident_shares
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = incident_id AND i.owner_id = auth.uid())
);

-- Only owners can DELETE share rows
DROP POLICY IF EXISTS shares_delete ON public.incident_shares;
CREATE POLICY shares_delete
ON public.incident_shares
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = incident_shares.incident_id AND i.owner_id = auth.uid())
);

-- Create index for performance on sharing queries
CREATE INDEX IF NOT EXISTS idx_incident_shares_incident_shared 
ON public.incident_shares (incident_id, shared_with);

CREATE INDEX IF NOT EXISTS idx_incident_shares_expires 
ON public.incident_shares (expires_at) WHERE expires_at IS NOT NULL;