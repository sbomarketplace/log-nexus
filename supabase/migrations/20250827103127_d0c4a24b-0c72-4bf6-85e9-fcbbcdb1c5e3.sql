-- Create a dedicated schema for extensions
create schema if not exists extensions;

-- Move common relocatable extensions (run only those you use)
alter extension if exists pgcrypto  set schema extensions;
alter extension if exists pg_trgm   set schema extensions;
alter extension if exists uuid_ossp set schema extensions;

-- Ensure app roles resolve functions in the new schema
alter role anon          set search_path = public, extensions, pg_temp;
alter role authenticated set search_path = public, extensions, pg_temp;
alter role service_role  set search_path = public, extensions, pg_temp;