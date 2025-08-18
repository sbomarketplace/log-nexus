-- Fix the function search path security issue
create or replace function public.set_incident_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
  if new.owner_id is null then
    new.owner_id := auth.uid();
  end if;
  return new;
end
$func$;