-- 1) Enable RLS
alter table public.incidents enable row level security;

-- 2) Owner column if missing
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'incidents'
      and column_name = 'owner_id'
  ) then
    alter table public.incidents
      add column owner_id uuid references auth.users(id);
  end if;
end $$;

-- Optional read share toggle if you plan to support shared viewing
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'incidents'
      and column_name = 'is_shared'
  ) then
    alter table public.incidents
      add column is_shared boolean not null default false;
  end if;
end $$;

-- 3) Trigger to set owner_id on insert if null
create or replace function public.set_incident_owner()
returns trigger
language plpgsql
security definer
as $func$
begin
  if new.owner_id is null then
    new.owner_id := auth.uid();
  end if;
  return new;
end
$func$;

drop trigger if exists trg_set_incident_owner on public.incidents;
create trigger trg_set_incident_owner
before insert on public.incidents
for each row execute function public.set_incident_owner();

-- 4) Drop existing insecure policies
drop policy if exists "Allow anonymous delete access to incidents" on public.incidents;
drop policy if exists "Allow anonymous insert access to incidents" on public.incidents;
drop policy if exists "Allow anonymous read access to incidents" on public.incidents;

-- Read own rows
create policy "incidents_select_own"
on public.incidents
for select
to authenticated
using (owner_id = auth.uid());

-- Optional shared read for anyone authenticated
create policy "incidents_select_shared"
on public.incidents
for select
to authenticated
using (is_shared = true);

-- Insert own
create policy "incidents_insert_own"
on public.incidents
for insert
to authenticated
with check (owner_id = auth.uid());

-- Update own
create policy "incidents_update_own"
on public.incidents
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- Delete own
create policy "incidents_delete_own"
on public.incidents
for delete
to authenticated
using (owner_id = auth.uid());