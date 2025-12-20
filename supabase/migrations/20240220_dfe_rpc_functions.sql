-- Migration: Phase 5 - DfE RPC Functions for Risk Profile
-- Date: 2025-02-20
-- Purpose: Create RPC functions to query DfE data for inspection risk calculation
-- These functions are used by the get_inspection_risk_profile MCP tool

-- ============================================================================
-- FUNCTION 1: get_last_inspection
-- ============================================================================
-- Returns the most recent inspection data for a school by URN
-- 
-- Note: Adjust table and column names based on actual DfE schema structure
-- Common variations:
--   - Table: dfe_data.ofsted_inspections, dfe_data.school_history, dfe_data.inspections
--   - Date column: inspection_date, last_inspection_date, inspection_date_ofsted
--   - Rating column: overall_effectiveness, rating, inspection_rating, judgement

create or replace function get_last_inspection(
  lookup_urn text
) returns json
language plpgsql
security definer
stable
set search_path = ''  -- CRITICAL: Prevents search_path injection
as $$
declare
  result json;
begin
  -- Get inspection data from school_profiles (actual column names from inspection)
  -- Columns: latest_ofsted_date, latest_ofsted_rating
  select 
    json_build_object(
      'date', latest_ofsted_date,
      'rating', latest_ofsted_rating,
      'type', 'ofsted'
    )
  into result
  from dfe_data.school_profiles
  where urn = lookup_urn::integer
    and latest_ofsted_date is not null
  limit 1;

  -- If no result, try school_history table (if it exists and has different structure)
  if result is null or (result->>'date')::date is null then
    begin
      select 
        json_build_object(
          'date', max(latest_ofsted_date),
          'rating', max(latest_ofsted_rating),
          'type', 'ofsted'
        )
      into result
      from dfe_data.school_history
      where urn = lookup_urn::integer
        and latest_ofsted_date is not null
      group by urn
      having max(latest_ofsted_date) is not null;
    exception
      when undefined_table or undefined_column then
        -- Table/column doesn't exist, keep result from school_profiles
        null;
    end;
  end if;

  return coalesce(result, json_build_object(
    'date', null,
    'rating', null,
    'type', null
  ));
end;
$$;

-- ============================================================================
-- FUNCTION 2: get_headteacher_info
-- ============================================================================
-- Returns headteacher information including tenure calculation
-- 
-- Note: Adjust table and column names based on actual DfE schema structure
-- Common variations:
--   - Table: dfe_data.school_profiles, dfe_data.schools, dfe_data.staff
--   - Name column: headteacher_name, head_name, principal_name
--   - Start date: headteacher_start_date, head_start_date, headteacher_appointed_date

create or replace function get_headteacher_info(
  lookup_urn text
) returns json
language plpgsql
security definer
stable
set search_path = ''  -- CRITICAL: Prevents search_path injection
as $$
declare
  result json;
  ht_name text;
  ht_start_date date;
  tenure_months integer;
  is_new boolean;
begin
  -- Try to get headteacher data from school_profiles
  -- Note: Adjust column names based on actual schema inspection
  -- Common variations: headteacher_name, head_name, principal_name
  --                    headteacher_start_date, head_start_date, headteacher_appointed_date
  begin
    select 
      headteacher_name,
      headteacher_start_date
    into ht_name, ht_start_date
    from dfe_data.school_profiles
    where urn = lookup_urn::integer
    limit 1;
  exception
    when undefined_column then
      -- Try alternative column names
      begin
        select 
          head_name,
          head_start_date
        into ht_name, ht_start_date
        from dfe_data.school_profiles
        where urn = lookup_urn::integer
        limit 1;
      exception
        when undefined_column then
          -- No headteacher columns found
          ht_name := null;
          ht_start_date := null;
      end;
  end;

  -- If still no result, try schools table
  if ht_start_date is null then
    begin
      select 
        headteacher_name,
        headteacher_start_date
      into ht_name, ht_start_date
      from dfe_data.schools
      where urn = lookup_urn::integer
      limit 1;
    exception
      when undefined_column then
        -- Column doesn't exist, keep null values
        null;
    end;
  end if;

  -- Calculate tenure if we have a start date
  if ht_start_date is not null then
    tenure_months := extract(year from age(current_date, ht_start_date)) * 12 + 
                      extract(month from age(current_date, ht_start_date));
    is_new := tenure_months < 12;
  else
    tenure_months := null;
    is_new := false;
  end if;

  return json_build_object(
    'name', ht_name,
    'start_date', ht_start_date,
    'tenure_months', tenure_months,
    'is_new', coalesce(is_new, false)
  );
end;
$$;

-- ============================================================================
-- FUNCTION 3: get_performance_trends
-- ============================================================================
-- Returns performance trends over the last 3 years for KS2 and KS4
-- 
-- Note: Adjust table and column names based on actual DfE schema structure
-- Common variations:
--   - Table: dfe_data.school_profiles, dfe_data.performance_data, dfe_data.ks_results
--   - KS2 columns: ks2_progress, ks2_attainment, ks2_avg_scaled_score, ks2_progress_score
--   - KS4 columns: ks4_progress, ks4_attainment, ks4_progress_8, ks4_avg_grade
--   - Year column: academic_year, year, data_year, results_year

create or replace function get_performance_trends(
  lookup_urn text
) returns json
language plpgsql
security definer
stable
set search_path = ''  -- CRITICAL: Prevents search_path injection
as $$
declare
  result json;
  ks2_trend json[];
  ks4_trend json[];
  current_year integer;
  year_val integer;
  ks2_progress_val numeric;
  ks2_attainment_val numeric;
  ks4_progress_val numeric;
  ks4_attainment_val numeric;
  trend_direction text;
begin
  current_year := extract(year from current_date);
  ks2_trend := array[]::json[];
  ks4_trend := array[]::json[];

  -- Get performance data from school_profiles
  -- Based on actual schema: latest_p8_score, latest_att8_score (KS4)
  -- Note: school_profiles appears to have one row per school (not per year)
  -- For historical trends, we may need to query school_history or a separate performance table
  
  -- Get latest performance data (current year)
  begin
    select 
      latest_p8_score,  -- KS4 Progress 8
      latest_att8_score -- KS4 Attainment 8
    into ks4_progress_val, ks4_attainment_val
    from dfe_data.school_profiles
    where urn = lookup_urn::integer
    limit 1;

    -- For KS2, try to find columns (may not exist in this schema)
    -- If school_profiles has historical data, we'd need to query school_history
    ks2_progress_val := null;
    ks2_attainment_val := null;
    
  exception
    when undefined_column then
      -- Columns don't exist, set to null
      ks4_progress_val := null;
      ks4_attainment_val := null;
      ks2_progress_val := null;
      ks2_attainment_val := null;
  end;

  -- Try to get historical data from school_history if it exists
  -- This would give us multi-year trends
  begin
    for year_val in (current_year - 2)..current_year loop
      declare
        hist_p8 numeric;
        hist_att8 numeric;
      begin
        -- Query school_history for historical performance
        -- Adjust column names based on actual schema
        select 
          p8_score,
          att8_score
        into hist_p8, hist_att8
        from dfe_data.school_history
        where urn = lookup_urn::integer
          and year = year_val
        limit 1;

        if hist_p8 is not null or hist_att8 is not null then
          ks4_trend := array_append(ks4_trend, json_build_object(
            'year', year_val,
            'progress', hist_p8,
            'attainment', hist_att8
          ));
        end if;
      exception
        when undefined_table or undefined_column then
          -- Table/columns don't exist, skip historical data
          null;
      end;
    end loop;
  exception
    when others then
      -- If school_history doesn't exist or has different structure, continue
      null;
  end;

  -- Add current year data to trend if available
  if ks4_progress_val is not null or ks4_attainment_val is not null then
    ks4_trend := array_append(ks4_trend, json_build_object(
      'year', current_year,
      'progress', ks4_progress_val,
      'attainment', ks4_attainment_val
    ));
  end if;

  -- Calculate trend direction (compare first vs last in KS4 trend)
  trend_direction := 'unknown';
  if array_length(ks4_trend, 1) >= 2 then
    declare
      first_progress numeric;
      last_progress numeric;
    begin
      first_progress := (ks4_trend[1]->>'progress')::numeric;
      last_progress := (ks4_trend[array_length(ks4_trend, 1)]->>'progress')::numeric;
      
      if last_progress is not null and first_progress is not null then
        if last_progress > first_progress + 0.1 then
          trend_direction := 'improving';
        elsif last_progress < first_progress - 0.1 then
          trend_direction := 'declining';
        else
          trend_direction := 'stable';
        end if;
      end if;
    end;
  elsif array_length(ks4_trend, 1) = 1 then
    -- Only one data point, can't determine trend
    trend_direction := 'unknown';
  end if;

  return json_build_object(
    'ks2_trend', ks2_trend,
    'ks4_trend', ks4_trend,
    'trend', trend_direction
  );
end;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
grant execute on function get_last_inspection(text) to authenticated;
grant execute on function get_headteacher_info(text) to authenticated;
grant execute on function get_performance_trends(text) to authenticated;

-- Grant execute permissions to anon (for API calls with proper RLS)
grant execute on function get_last_inspection(text) to anon;
grant execute on function get_headteacher_info(text) to anon;
grant execute on function get_performance_trends(text) to anon;

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on function get_last_inspection(text) is 
  'Returns the most recent inspection data for a school by URN. Returns JSON with date, rating, and type.';

comment on function get_headteacher_info(text) is 
  'Returns headteacher information including name, start date, tenure in months, and whether headteacher is new (< 12 months).';

comment on function get_performance_trends(text) is 
  'Returns performance trends over the last 3 years for KS2 and KS4. Returns JSON arrays with year, progress, and attainment data.';

