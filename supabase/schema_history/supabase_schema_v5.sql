-- Fix for Credit Score not saving in the Client Dashboard

do $$
begin
    -- Add credit_score column to clients table if it doesn't exist
    if not exists (select 1 from information_schema.columns where table_name = 'clients' and column_name = 'credit_score') then
        alter table clients add column credit_score integer;
    end if;

    -- Ensure water_consumption and cleaning_consumption exist just in case
    if not exists (select 1 from information_schema.columns where table_name = 'clients' and column_name = 'water_consumption') then
        alter table clients add column water_consumption numeric;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'clients' and column_name = 'cleaning_consumption') then
        alter table clients add column cleaning_consumption numeric;
    end if;

    -- Add missing location colums
    if not exists (select 1 from information_schema.columns where table_name = 'clients' and column_name = 'city') then
        alter table clients add column city text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'clients' and column_name = 'state') then
        alter table clients add column state text;
    end if;
end $$;
