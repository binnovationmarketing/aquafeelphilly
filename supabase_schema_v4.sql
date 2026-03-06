-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Update Analysts table with new hierarchy fields
-- We use a do block to check if columns exist before adding them
do $$
begin
    -- Add first_name if not exists
    if not exists (select 1 from information_schema.columns where table_name = 'analysts' and column_name = 'first_name') then
        alter table analysts add column first_name text;
    end if;

    -- Add last_name if not exists
    if not exists (select 1 from information_schema.columns where table_name = 'analysts' and column_name = 'last_name') then
        alter table analysts add column last_name text;
    end if;

    -- Add aquafeel_email if not exists
    if not exists (select 1 from information_schema.columns where table_name = 'analysts' and column_name = 'aquafeel_email') then
        alter table analysts add column aquafeel_email text;
    end if;

    -- Add manager_name if not exists
    if not exists (select 1 from information_schema.columns where table_name = 'analysts' and column_name = 'manager_name') then
        alter table analysts add column manager_name text;
    end if;

    -- Add director_name if not exists
    if not exists (select 1 from information_schema.columns where table_name = 'analysts' and column_name = 'director_name') then
        alter table analysts add column director_name text;
    end if;

    -- Add ambassador_name if not exists
    if not exists (select 1 from information_schema.columns where table_name = 'analysts' and column_name = 'ambassador_name') then
        alter table analysts add column ambassador_name text;
    end if;
    
    -- Add office if not exists (useful for grouping)
    if not exists (select 1 from information_schema.columns where table_name = 'analysts' and column_name = 'office') then
        alter table analysts add column office text;
    end if;

    -- Add division if not exists (useful for grouping)
    if not exists (select 1 from information_schema.columns where table_name = 'analysts' and column_name = 'division') then
        alter table analysts add column division text;
    end if;
end $$;

-- 2. Update Clients table to include hierarchy snapshot (optional but good for historical data)
-- Or we can just join with analysts table. Let's keep it normalized and join in the query.

-- 3. Update RLS policies to allow hierarchy visibility
-- Managers should see their direct reports, Directors their managers' teams, etc.
-- For now, we'll keep the simple "Manager sees all" policy but refine it later if needed.

-- 4. Create a function to update full_name automatically
create or replace function public.update_analyst_full_name()
returns trigger as $$
begin
  new.full_name := trim(coalesce(new.first_name, '') || ' ' || coalesce(new.last_name, ''));
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_analyst_name_update on analysts;
create trigger on_analyst_name_update
  before insert or update of first_name, last_name on analysts
  for each row execute procedure public.update_analyst_full_name();
