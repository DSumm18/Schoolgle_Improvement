-- Migration: Create approval queue and update skill tiers
-- Date: 20260210

-- 1. Create the approval queue table
create table if not exists ed_approval_queue (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  skill_id text not null,
  context jsonb not null,
  payload jsonb not null, -- The CommunicationPayload
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  approver_id uuid references users(id),
  approved_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone default now()
);

-- 2. Add approval_tier to school_skills_config
alter table school_skills_config add column if not exists approval_tier text default 'AUTO' check (approval_tier in ('AUTO', 'SHADOW', 'REVIEW', 'BLOCKED'));

-- 3. RLS
alter table ed_approval_queue enable row level security;

create policy "Admins see approval queue" on ed_approval_queue
  for all using (
    exists (
      select 1 from organization_members 
      where organization_id = ed_approval_queue.organization_id 
      and user_id = auth.uid()::text 
      and role in ('admin', 'slt')
    )
  );
