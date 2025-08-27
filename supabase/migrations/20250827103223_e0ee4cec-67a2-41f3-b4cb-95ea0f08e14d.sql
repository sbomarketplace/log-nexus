-- Create a dedicated schema for extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move relocatable extensions to extensions schema
-- Only attempt to move extensions that actually exist
DO $$
BEGIN
    -- Move pgcrypto if it exists
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
        ALTER EXTENSION pgcrypto SET SCHEMA extensions;
    END IF;
    
    -- Move pg_trgm if it exists  
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        ALTER EXTENSION pg_trgm SET SCHEMA extensions;
    END IF;
    
    -- Move uuid-ossp if it exists
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
    END IF;
END
$$;

-- Update search_path for all Supabase roles to include extensions schema
ALTER ROLE anon SET search_path = public, extensions, pg_temp;
ALTER ROLE authenticated SET search_path = public, extensions, pg_temp;
ALTER ROLE service_role SET search_path = public, extensions, pg_temp;