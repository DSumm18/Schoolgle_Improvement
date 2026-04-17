-- Pathfinder productionisation: source metadata, revision lifecycle, and
-- private storage bucket for uploaded PDFs / rasterised pages.
--
-- Additive to 20260414_pathfinder_estates_integration.sql. No destructive
-- changes; existing Pathfinder model rows remain valid.

-- ── Columns ───────────────────────────────────────────────────────────────
alter table public.estates_pathfinder_models
  add column if not exists source_document_id text,
  add column if not exists source_document_provider text,
  add column if not exists source_document_path text,
  add column if not exists source_page_number integer,
  add column if not exists generated_image_url text,
  add column if not exists extraction_mode text,
  add column if not exists extraction_timestamp timestamptz,
  add column if not exists parent_model_id uuid references public.estates_pathfinder_models(id) on delete set null,
  add column if not exists revision_number integer not null default 1,
  add column if not exists is_live boolean not null default false,
  add column if not exists superseded_by uuid references public.estates_pathfinder_models(id) on delete set null;

-- Only one live Pathfinder model per organisation.
create unique index if not exists idx_estates_pathfinder_models_org_live
  on public.estates_pathfinder_models (organization_id)
  where is_live = true;

create index if not exists idx_estates_pathfinder_models_org_parent
  on public.estates_pathfinder_models (organization_id, parent_model_id);

-- ── Storage bucket ────────────────────────────────────────────────────────
-- Private bucket holding original uploads + rasterised page images.
-- Path convention: {organizationId}/{modelId}/source.pdf
--                  {organizationId}/{modelId}/page-{n}.png
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pathfinder-sources',
  'pathfinder-sources',
  false,
  52428800, -- 50 MB cap per file
  array['application/pdf','image/png','image/jpeg','image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── Storage RLS ───────────────────────────────────────────────────────────
-- Read: any member of the organisation referenced by the first path segment.
drop policy if exists "Pathfinder sources readable by org members"
  on storage.objects;
create policy "Pathfinder sources readable by org members"
  on storage.objects
  for select
  using (
    bucket_id = 'pathfinder-sources'
    and exists (
      select 1
      from public.organization_members om
      where om.user_id = auth.uid()
        and om.organization_id::text = split_part(name, '/', 1)
    )
  );

-- Write: estates staff in the organisation referenced by the first path segment.
drop policy if exists "Pathfinder sources writable by estates staff"
  on storage.objects;
create policy "Pathfinder sources writable by estates staff"
  on storage.objects
  for insert
  with check (
    bucket_id = 'pathfinder-sources'
    and exists (
      select 1
      from public.organization_members om
      where om.user_id = auth.uid()
        and om.organization_id::text = split_part(name, '/', 1)
        and om.role in ('admin','headteacher','slt','teacher','caretaker')
    )
  );

drop policy if exists "Pathfinder sources updatable by estates staff"
  on storage.objects;
create policy "Pathfinder sources updatable by estates staff"
  on storage.objects
  for update
  using (
    bucket_id = 'pathfinder-sources'
    and exists (
      select 1
      from public.organization_members om
      where om.user_id = auth.uid()
        and om.organization_id::text = split_part(name, '/', 1)
        and om.role in ('admin','headteacher','slt','teacher','caretaker')
    )
  );

drop policy if exists "Pathfinder sources deletable by estates staff"
  on storage.objects;
create policy "Pathfinder sources deletable by estates staff"
  on storage.objects
  for delete
  using (
    bucket_id = 'pathfinder-sources'
    and exists (
      select 1
      from public.organization_members om
      where om.user_id = auth.uid()
        and om.organization_id::text = split_part(name, '/', 1)
        and om.role in ('admin','headteacher','slt','teacher','caretaker')
    )
  );
