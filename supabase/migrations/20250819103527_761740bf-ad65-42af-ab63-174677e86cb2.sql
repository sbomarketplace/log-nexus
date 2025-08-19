-- Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add case number columns to incidents table
ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS case_number TEXT;

ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS case_number_norm TEXT
  GENERATED ALWAYS AS (
    regexp_replace(lower(coalesce(case_number, '')), '[^a-z0-9]', '', 'g')
  ) STORED;

-- Create indexes for fast search
CREATE INDEX IF NOT EXISTS incidents_case_number_idx ON incidents (case_number);
CREATE INDEX IF NOT EXISTS incidents_case_number_norm_trgm_idx
  ON incidents USING GIN (case_number_norm gin_trgm_ops);

-- Update RLS policies to include case_number in allowed updates
-- (The existing policies should cover this, but let's ensure case_number is accessible)