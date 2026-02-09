-- Migration: Create staff_absences table
-- Date: 20260210

create table if not exists staff_absences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  staff_id uuid references staff_directory(id) on delete cascade,
  absence_type text not null check (absence_type in ('sickness', 'emergency_leave', 'medical_appointment', 'other')),
  start_date timestamp with time zone not null,
  end_date timestamp with time zone,
  reason text,
  reported_at timestamp with time zone default now(),
  status text default 'reported' check (status in ('reported', 'acknowledged', 'cancelled')),
  metadata jsonb default '{}'
);

-- Enable RLS
alter table staff_absences enable row level security;

-- Policies
create policy "Staff see own absences" on staff_absences 
  for select using (
    exists (
      select 1 from organization_members 
      where organization_id = staff_absences.organization_id 
      and user_id = auth.uid()::text
    )
  );

create policy "Admins manage all absences" on staff_absences 
  for all using (
    exists (
      select 1 from organization_members 
      where organization_id = staff_absences.organization_id 
      and user_id = auth.uid()::text 
      and role in ('admin', 'slt')
    )
  );
