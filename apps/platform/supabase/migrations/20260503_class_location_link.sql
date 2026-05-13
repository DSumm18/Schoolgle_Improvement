alter table if exists public.ls_classes
  add column if not exists location_id uuid references public.estates_locations(id) on delete set null;

create index if not exists idx_ls_classes_location_id
  on public.ls_classes(location_id);
