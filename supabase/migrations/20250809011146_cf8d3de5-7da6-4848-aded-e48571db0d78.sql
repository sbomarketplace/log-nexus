-- Create incidents table for storing parsed incident events
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  events JSONB NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Add simple policy for anonymous read/write (will secure later)
CREATE POLICY "Allow anonymous read access to incidents"
ON public.incidents
FOR SELECT
USING (true);

CREATE POLICY "Allow anonymous insert access to incidents"
ON public.incidents
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow anonymous delete access to incidents"
ON public.incidents
FOR DELETE
USING (true);