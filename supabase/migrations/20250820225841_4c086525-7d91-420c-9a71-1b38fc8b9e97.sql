BEGIN;

-- Add title column and normalized title for search
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS title_norm TEXT
  GENERATED ALWAYS AS (regexp_replace(lower(coalesce(title,'')), '[^a-z0-9 ]', '', 'g')) STORED;

-- Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram index for fast partial text search on normalized title
CREATE INDEX IF NOT EXISTS incidents_title_norm_trgm_idx ON incidents USING GIN (title_norm gin_trgm_ops);

COMMIT;