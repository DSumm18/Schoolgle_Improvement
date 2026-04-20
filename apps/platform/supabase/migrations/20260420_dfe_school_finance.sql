-- DfE Schools Financial Benchmarking (SFB) — per-school income & expenditure (CFR + AAR)
-- Source: https://financial-benchmarking-and-insights-tool.education.gov.uk/data-sources
-- Imported via: scripts/import-sfb-finance.mjs
create schema if not exists dfe_data;

create table if not exists dfe_data.school_finance (
  id uuid primary key default gen_random_uuid(),
  urn integer not null,
  financial_year text not null,               -- e.g. '2023-24'
  academic_year_end integer,                  -- e.g. 2024
  source text not null,                       -- 'CFR' (maintained) or 'AAR' (academy)

  -- Pupil / staff headcount used for per-pupil calcs
  number_of_pupils numeric,
  fte_teachers numeric,
  phase text,
  la_code text,
  la_name text,
  school_name text,

  -- Income (aggregate — raw CFR codes)
  total_income_gbp numeric,
  total_funding_gbp numeric,                  -- Grant Funding: I01-I07 + I15 + I16 + I18
  pupil_premium_income_gbp numeric,           -- I05
  sen_funding_gbp numeric,                    -- I03 / BAI030
  grants_income_gbp numeric,                  -- Direct Grants
  self_generated_income_gbp numeric,

  -- Expenditure (aggregate)
  total_expenditure_gbp numeric,

  -- Staff costs
  teaching_staff_gbp numeric,                 -- E01 / BAE010
  supply_staff_gbp numeric,                   -- Supply Staff: E02 + E10 + E26 (CFR) or Supply Staff Costs (AAR)
  education_support_gbp numeric,              -- E03 / BAE030
  premises_staff_gbp numeric,                 -- E04 / BAE050
  admin_staff_gbp numeric,                    -- E05 / BAE040
  catering_staff_gbp numeric,                 -- E06 / BAE060
  other_staff_gbp numeric,
  total_staff_gbp numeric,

  -- Premises / occupation
  premises_gbp numeric,                       -- Premises: E04 + E12-E14 + E28b (CFR) / AAR Premises Costs
  maintenance_gbp numeric,                    -- E12 + E13
  energy_gbp numeric,                         -- E16 / BAE150
  catering_expenses_gbp numeric,
  learning_resources_gbp numeric,             -- E19 / BAE200

  -- Position
  surplus_deficit_gbp numeric,                -- In-year Balance
  reserves_gbp numeric,                       -- Revenue Reserve: B01 + B02 + B06 / BAB030

  -- Per-pupil derived
  income_per_pupil_gbp numeric,
  expenditure_per_pupil_gbp numeric,
  teaching_per_pupil_gbp numeric,
  support_per_pupil_gbp numeric,

  -- Average teacher cost (teaching £ / FTE teachers)
  avg_teacher_cost_gbp numeric,

  -- Metadata
  source_file text,
  imported_at timestamptz default now(),

  unique (urn, financial_year)
);

create index if not exists school_finance_urn on dfe_data.school_finance (urn);
create index if not exists school_finance_year on dfe_data.school_finance (financial_year);
create index if not exists school_finance_urn_year on dfe_data.school_finance (urn, financial_year desc);
create index if not exists school_finance_source on dfe_data.school_finance (source);
