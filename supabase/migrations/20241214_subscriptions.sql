-- Migration: Subscriptions & Billing System
-- Date: 2024-12-14
-- Purpose: Add subscription management for Ed Pro and other paid products

-- ============================================================================
-- SUBSCRIPTION PLANS
-- ============================================================================

-- Fix existing constraint if table already exists (add new product types)
do $$
begin
  -- Drop old constraint if it exists
  if exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'subscription_plans_product_check' 
    and table_name = 'subscription_plans'
  ) then
    alter table subscription_plans drop constraint subscription_plans_product_check;
    alter table subscription_plans add constraint subscription_plans_product_check 
      check (product in ('ed_pro', 'ofsted_ready', 'bundle', 'parent_ed', 'toolbox_pro'));
  end if;
end $$;

create table if not exists subscription_plans (
  id text primary key,
  name text not null,
  description text,
  product text not null check (product in ('ed_pro', 'ofsted_ready', 'bundle', 'parent_ed', 'toolbox_pro')),
  
  -- Pricing (in pence to avoid decimal issues)
  price_monthly integer not null, -- e.g., 4900 = £49.00
  price_annual integer not null,  -- e.g., 49000 = £490.00 (2 months free)
  
  -- Pupil tier (null means any size)
  min_pupils integer,
  max_pupils integer,
  
  -- Feature flags (jsonb for flexibility)
  features jsonb default '{}'::jsonb,
  -- e.g., {"voice": true, "languages": true, "act_mode": true, "school_embed": true}
  
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed initial plans
insert into subscription_plans (id, name, description, product, price_monthly, price_annual, min_pupils, max_pupils, features, display_order) values
  -- Ed Pro tiers by school size (browser extension AI assistant)
  ('ed_pro_small', 'Ed Pro - Small School', 'AI assistant for schools under 200 pupils', 'ed_pro', 2900, 29000, 0, 199, 
   '{"voice": true, "languages": true, "tool_help": true, "school_knowledge": "basic"}'::jsonb, 1),
  ('ed_pro_medium', 'Ed Pro - Medium School', 'AI assistant for schools 200-500 pupils', 'ed_pro', 4900, 49000, 200, 500,
   '{"voice": true, "languages": true, "tool_help": true, "school_knowledge": "full"}'::jsonb, 2),
  ('ed_pro_large', 'Ed Pro - Large School', 'AI assistant for schools 500+ pupils', 'ed_pro', 7900, 79000, 501, 2000,
   '{"voice": true, "languages": true, "tool_help": true, "school_knowledge": "full", "act_mode": true}'::jsonb, 3),
  
  -- Ofsted Ready (separate product - inspection readiness platform)
  ('ofsted_ready_standard', 'Ofsted Ready - Standard', 'DfE data analysis and SEF support', 'ofsted_ready', 9900, 99000, null, null,
   '{"dfe_analysis": true, "sef_support": true, "trend_analysis": true}'::jsonb, 10),
  ('ofsted_ready_premium', 'Ofsted Ready - Premium', 'Full analysis with comparisons and deep dive', 'ofsted_ready', 14900, 149000, null, null,
   '{"dfe_analysis": true, "sef_support": true, "trend_analysis": true, "comparisons": true, "deep_dive": true}'::jsonb, 11),
  
  -- Parent Ed (embedded chatbot for school websites)
  ('parent_ed_basic', 'Parent Ed - Basic', 'Website chatbot for parent queries', 'parent_ed', 1900, 19000, null, null,
   '{"website_embed": true, "faq_answers": true, "languages": true}'::jsonb, 20),
  ('parent_ed_premium', 'Parent Ed - Premium', 'Advanced website chatbot with forms', 'parent_ed', 3900, 39000, null, null,
   '{"website_embed": true, "faq_answers": true, "languages": true, "form_handling": true, "appointment_booking": true}'::jsonb, 21),
  
  -- Bundles
  ('bundle_ed_ofsted_small', 'Ed + Ofsted Bundle - Small', 'Complete package for small schools', 'bundle', 11900, 119000, 0, 199,
   '{"voice": true, "languages": true, "tool_help": true, "dfe_analysis": true, "sef_support": true, "trend_analysis": true}'::jsonb, 30),
  ('bundle_ed_ofsted_medium', 'Ed + Ofsted Bundle - Medium', 'Complete package for medium schools', 'bundle', 17900, 179000, 200, 500,
   '{"voice": true, "languages": true, "tool_help": true, "school_knowledge": "full", "dfe_analysis": true, "sef_support": true, "trend_analysis": true, "comparisons": true}'::jsonb, 31),
  ('bundle_everything', 'Ultimate School Bundle', 'Everything - Ed Pro, Ofsted Ready, Parent Ed', 'bundle', 19900, 199000, null, null,
   '{"voice": true, "languages": true, "tool_help": true, "school_knowledge": "full", "act_mode": true, "dfe_analysis": true, "sef_support": true, "trend_analysis": true, "comparisons": true, "deep_dive": true, "website_embed": true, "faq_answers": true}'::jsonb, 40)
on conflict (id) do nothing;

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================

-- Add product column if table exists but column doesn't
do $$
declare
  plan_col_name text;
begin
  if exists (select 1 from information_schema.tables where table_name = 'subscriptions') then
    -- Check which plan column exists
    select column_name into plan_col_name
    from information_schema.columns
    where table_name = 'subscriptions'
      and column_name in ('plan', 'plan_id')
    limit 1;
    
    -- Rename 'plan' to 'plan_id' for consistency if needed
    if plan_col_name = 'plan' then
      alter table subscriptions rename column plan to plan_id;
    end if;
    
    -- Add product column if it doesn't exist
    if not exists (
      select 1 from information_schema.columns 
      where table_name = 'subscriptions' and column_name = 'product'
    ) then
      alter table subscriptions add column product text;
      
      -- Backfill product from plan
      update subscriptions s
      set product = p.product
      from subscription_plans p
      where s.plan_id = p.id;
      
      -- Make it NOT NULL after backfill
      alter table subscriptions alter column product set not null;
      alter table subscriptions add constraint subscriptions_product_check 
        check (product in ('ed_pro', 'ofsted_ready', 'bundle', 'parent_ed', 'toolbox_pro'));
      
      -- Add unique constraint if it doesn't exist
      if not exists (
        select 1 from information_schema.table_constraints 
        where constraint_name = 'subscriptions_organization_id_product_key'
      ) then
        alter table subscriptions add constraint subscriptions_organization_id_product_key 
          unique (organization_id, product);
      end if;
    end if;
  end if;
end $$;

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  plan_id text references subscription_plans(id) not null,
  
  -- Product (denormalized for easy querying - one subscription per product per org)
  product text not null check (product in ('ed_pro', 'ofsted_ready', 'bundle', 'parent_ed', 'toolbox_pro')),
  
  -- Status
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
  
  -- Dates
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancelled_at timestamp with time zone,
  
  -- Payment
  payment_method text check (payment_method in ('card', 'direct_debit', 'invoice', 'manual')),
  stripe_subscription_id text,
  stripe_customer_id text,
  gocardless_mandate_id text,
  
  -- Auto-renewal
  auto_renew boolean default true,
  
  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by text references users(id)
);

-- Add unique constraint separately (idempotent)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'subscriptions_organization_id_product_key'
    and table_name = 'subscriptions'
  ) then
    alter table subscriptions add constraint subscriptions_organization_id_product_key 
      unique (organization_id, product);
  end if;
end $$;

create index if not exists subscriptions_organization_idx on subscriptions (organization_id);
create index if not exists subscriptions_status_idx on subscriptions (status);
create index if not exists subscriptions_period_end_idx on subscriptions (current_period_end);
create index if not exists subscriptions_product_idx on subscriptions (product);
create index if not exists subscriptions_org_product_idx on subscriptions (organization_id, product);

-- ============================================================================
-- INVOICES
-- ============================================================================

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  subscription_id uuid references subscriptions(id) on delete set null,
  
  -- Invoice details
  invoice_number text not null unique,
  amount integer not null, -- in pence
  currency text default 'GBP',
  description text,
  
  -- Status
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),
  
  -- Dates
  issued_date date,
  due_date date,
  paid_date date,
  
  -- Payment reference (for bank transfers)
  payment_reference text unique, -- e.g., "SCH-123456" for bank transfer matching
  
  -- Stripe/GoCardless
  stripe_invoice_id text,
  gocardless_payment_id text,
  
  -- PDF storage
  pdf_url text,
  
  -- Recipient
  billing_email text,
  billing_name text,
  billing_address jsonb,
  
  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists invoices_organization_idx on invoices (organization_id);
create index if not exists invoices_status_idx on invoices (status);
create index if not exists invoices_payment_reference_idx on invoices (payment_reference);

-- Generate invoice number sequence (only if not exists)
do $$
begin
  if not exists (select 1 from pg_sequences where schemaname = 'public' and sequencename = 'invoice_number_seq') then
    create sequence invoice_number_seq start 1000;
  end if;
end $$;

-- Function to generate invoice numbers
create or replace function generate_invoice_number()
returns text as $$
begin
  return 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_number_seq')::text, 5, '0');
end;
$$ language plpgsql;

-- ============================================================================
-- SUPER ADMINS (Schoolgle Staff)
-- ============================================================================

create table if not exists super_admins (
  user_id text primary key references users(id) on delete cascade,
  access_level text not null default 'support' check (access_level in ('support', 'admin', 'owner')),
  can_impersonate boolean default true,
  can_manage_subscriptions boolean default true,
  can_view_financials boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  granted_by text references users(id)
);

-- ============================================================================
-- SUBSCRIPTION AUDIT LOG
-- ============================================================================

create table if not exists subscription_audit_log (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references subscriptions(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  
  action text not null, -- 'created', 'upgraded', 'downgraded', 'cancelled', 'renewed', 'payment_received', 'payment_failed'
  old_status text,
  new_status text,
  old_plan_id text,
  new_plan_id text,
  
  amount integer, -- for payments
  notes text,
  
  performed_by text references users(id),
  performed_by_type text check (performed_by_type in ('user', 'super_admin', 'system', 'stripe_webhook')),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists subscription_audit_org_idx on subscription_audit_log (organization_id);
create index if not exists subscription_audit_sub_idx on subscription_audit_log (subscription_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table subscription_plans enable row level security;
alter table subscriptions enable row level security;
alter table invoices enable row level security;
alter table super_admins enable row level security;
alter table subscription_audit_log enable row level security;

-- Plans are public read
drop policy if exists "Plans are viewable by all" on subscription_plans;
create policy "Plans are viewable by all" on subscription_plans
  for select using (is_active = true);

-- Subscriptions: Org admins can view their own
drop policy if exists "Org admins can view subscriptions" on subscriptions;
create policy "Org admins can view subscriptions" on subscriptions
  for select using (
    organization_id in (
      select organization_id from organization_members 
      where user_id = auth.uid()::text and role in ('admin', 'slt')
    )
  );

-- Invoices: Org admins can view their own
drop policy if exists "Org admins can view invoices" on invoices;
create policy "Org admins can view invoices" on invoices
  for select using (
    organization_id in (
      select organization_id from organization_members 
      where user_id = auth.uid()::text and role in ('admin', 'slt')
    )
  );

-- Super admins can see everything
drop policy if exists "Super admins full access subscriptions" on subscriptions;
create policy "Super admins full access subscriptions" on subscriptions
  for all using (
    exists (select 1 from super_admins where user_id = auth.uid()::text)
  );

drop policy if exists "Super admins full access invoices" on invoices;
create policy "Super admins full access invoices" on invoices
  for all using (
    exists (select 1 from super_admins where user_id = auth.uid()::text)
  );

drop policy if exists "Super admins can view super_admins table" on super_admins;
create policy "Super admins can view super_admins table" on super_admins
  for select using (
    exists (select 1 from super_admins where user_id = auth.uid()::text and access_level in ('admin', 'owner'))
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if organization has active subscription for a specific product
create or replace function has_active_subscription(org_id uuid, product_type text default null)
returns boolean as $$
begin
  return exists (
    select 1 from subscriptions s
    where s.organization_id = org_id
      and s.status in ('trialing', 'active')
      and (s.current_period_end is null or s.current_period_end > now())
      and (s.trial_end is null or s.trial_end > now() or s.status != 'trialing')
      and (
        product_type is null 
        or s.product = product_type 
        or s.product = 'bundle'  -- Bundle includes all products
      )
  );
end;
$$ language plpgsql security definer;

-- Get all active products for an organization
create or replace function get_active_products(org_id uuid)
returns text[] as $$
declare
  products text[];
begin
  select array_agg(distinct 
    case 
      when s.product = 'bundle' then unnest(array['ed_pro', 'ofsted_ready', 'parent_ed'])
      else s.product
    end
  ) into products
  from subscriptions s
  where s.organization_id = org_id
    and s.status in ('trialing', 'active')
    and (s.current_period_end is null or s.current_period_end > now())
    and (s.trial_end is null or s.trial_end > now() or s.status != 'trialing');
  
  return coalesce(products, array[]::text[]);
end;
$$ language plpgsql security definer;

-- Get subscription features for an organization (merged from all active subscriptions)
create or replace function get_subscription_features(org_id uuid, product_type text default null)
returns jsonb as $$
declare
  features jsonb := '{}'::jsonb;
  sub_features jsonb;
begin
  -- Merge features from all active subscriptions
  for sub_features in
    select p.features
    from subscriptions s
    join subscription_plans p on s.plan_id = p.id
    where s.organization_id = org_id
      and s.status in ('trialing', 'active')
      and (s.current_period_end is null or s.current_period_end > now())
      and (product_type is null or s.product = product_type or s.product = 'bundle')
    order by p.price_annual desc
  loop
    features := features || coalesce(sub_features, '{}'::jsonb);
  end loop;
  
  return features;
end;
$$ language plpgsql security definer;

-- Get days remaining in trial/subscription for a specific product
create or replace function get_subscription_days_remaining(org_id uuid, product_type text default null)
returns integer as $$
declare
  end_date timestamp with time zone;
begin
  select 
    case 
      when status = 'trialing' then trial_end
      else current_period_end
    end into end_date
  from subscriptions
  where organization_id = org_id
    and status in ('trialing', 'active')
    and (product_type is null or product = product_type or product = 'bundle')
  order by 
    case when status = 'trialing' then trial_end else current_period_end end desc
  limit 1;
  
  if end_date is null then
    return null;
  end if;
  
  return greatest(0, extract(day from end_date - now())::integer);
end;
$$ language plpgsql security definer;

-- Get subscription summary for an organization (all products)
create or replace function get_subscription_summary(org_id uuid)
returns table (
  product text,
  plan_name text,
  status text,
  days_remaining integer,
  features jsonb
) as $$
begin
  return query
  select 
    s.product,
    p.name as plan_name,
    s.status,
    greatest(0, extract(day from 
      case when s.status = 'trialing' then s.trial_end else s.current_period_end end 
      - now()
    )::integer) as days_remaining,
    p.features
  from subscriptions s
  join subscription_plans p on s.plan_id = p.id
  where s.organization_id = org_id
    and s.status in ('trialing', 'active', 'past_due')
  order by s.product;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at on subscriptions
create or replace function update_subscription_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists subscriptions_updated_at on subscriptions;
create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute function update_subscription_timestamp();

drop trigger if exists invoices_updated_at on invoices;
create trigger invoices_updated_at
  before update on invoices
  for each row execute function update_subscription_timestamp();

-- Auto-generate payment reference for invoices
create or replace function generate_payment_reference()
returns trigger as $$
begin
  if new.payment_reference is null then
    -- Format: SCH-XXXXXX (6 random alphanumeric)
    new.payment_reference = 'SCH-' || upper(substring(md5(random()::text) from 1 for 6));
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists invoices_payment_reference on invoices;
create trigger invoices_payment_reference
  before insert on invoices
  for each row execute function generate_payment_reference();

