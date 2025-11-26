-- NOTE: This schema assumes user_id is text (Firebase UID). If you have existing tables with UUID, you must migrate or drop them.

-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create users table to map Firebase users
create table if not exists users (
  id text primary key, -- Firebase UID
  email text,
  display_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Organizations Table
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Organization Members Table
create table if not exists organization_members (
  organization_id uuid references organizations(id) on delete cascade,
  user_id text references users(id) on delete cascade,
  role text not null check (role in ('admin', 'teacher', 'slt')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (organization_id, user_id)
);

-- Invitations Table
create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  organization_id uuid references organizations(id) on delete cascade,
  role text not null check (role in ('admin', 'teacher', 'slt')),
  token uuid default gen_random_uuid(),
  invited_by text references users(id),
  status text default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default timezone('utc'::text, now() + interval '7 days') not null
);

-- Create a table to store your documents
create table if not exists documents (
  id bigserial primary key,
  user_id text references users(id) on delete cascade,
  organization_id uuid references organizations(id),
  content text, -- The text content of the file
  metadata jsonb, -- Metadata like filename, fileId, mimeType, provider, folderPath, webViewLink, scannedAt
  embedding vector(1536), -- OpenAI text-embedding-3-small outputs 1536 dimensions
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add unique constraint on user_id + fileId to prevent duplicates
create unique index if not exists documents_user_file_id_idx 
  on documents (user_id, (metadata->>'fileId'));

-- Create index for faster queries
create index if not exists documents_user_id_idx on documents (user_id);
create index if not exists documents_organization_id_idx on documents (organization_id);
create index if not exists documents_embedding_idx on documents using ivfflat (embedding vector_cosine_ops);

-- Create evidence_matches table to store AI-identified evidence
create table if not exists evidence_matches (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id) on delete cascade,
  organization_id uuid references organizations(id),
  document_id bigint references documents(id) on delete cascade,
  
  category_id text not null,
  category_name text not null,
  subcategory_id text not null,
  subcategory_name text not null,
  evidence_item text not null,
  
  confidence decimal(3,2) not null check (confidence >= 0 and confidence <= 1),
  relevance_explanation text,
  key_quotes text[], -- Array of relevant excerpts
  
  document_link text, -- Drive/OneDrive link
  folder_path text, -- Breadcrumb: "Root > Policies > Curriculum"
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Unique constraint to prevent duplicate evidence matches
create unique index if not exists evidence_matches_unique_idx 
  on evidence_matches (user_id, document_id, subcategory_id, evidence_item);

-- Indexes for faster queries
create index if not exists evidence_matches_user_id_idx on evidence_matches (user_id);
create index if not exists evidence_matches_organization_id_idx on evidence_matches (organization_id);
create index if not exists evidence_matches_category_idx on evidence_matches (category_id, subcategory_id);
create index if not exists evidence_matches_confidence_idx on evidence_matches (confidence desc);
create index if not exists evidence_matches_document_id_idx on evidence_matches (document_id);

-- Create scan_jobs table for tracking long-running scans (optional, for future)
create table if not exists scan_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id) on delete cascade,
  organization_id uuid references organizations(id),
  folder_id text not null,
  provider text not null check (provider in ('google.com', 'microsoft.com')),
  
  status text not null default 'pending' check (status in ('pending', 'scanning', 'complete', 'error')),
  total_files integer default 0,
  processed_files integer default 0,
  current_file text,
  
  results jsonb, -- Store final results
  error_message text,
  
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists scan_jobs_user_id_idx on scan_jobs (user_id);
create index if not exists scan_jobs_organization_id_idx on scan_jobs (organization_id);
create index if not exists scan_jobs_status_idx on scan_jobs (status);

-- Helper function to get user's organization IDs
create or replace function get_user_org_ids(requesting_user_id text)
returns setof uuid
language sql
security definer
as $$
  select organization_id from organization_members where user_id = requesting_user_id;
$$;

-- Create a function to search for documents
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_user_id text default null,
  filter_organization_id uuid default null
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 
    (filter_user_id is null or documents.user_id = filter_user_id)
    and (filter_organization_id is null or documents.organization_id = filter_organization_id)
    and 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Create function to get evidence summary by subcategory
create or replace function get_evidence_summary (
  filter_user_id text,
  filter_subcategory_id text default null,
  filter_organization_id uuid default null
)
returns table (
  subcategory_id text,
  subcategory_name text,
  evidence_item text,
  document_count bigint,
  avg_confidence decimal,
  documents jsonb
)
language plpgsql
as $$
begin
  return query
  select
    em.subcategory_id,
    em.subcategory_name,
    em.evidence_item,
    count(distinct em.document_id) as document_count,
    round(avg(em.confidence)::numeric, 2) as avg_confidence,
    jsonb_agg(
      jsonb_build_object(
        'name', d.metadata->>'filename',
        'link', em.document_link,
        'confidence', em.confidence,
        'folderPath', em.folder_path
      )
    ) as documents
  from evidence_matches em
  join documents d on d.id = em.document_id
  where 
    (filter_user_id is null or em.user_id = filter_user_id)
    and (filter_organization_id is null or em.organization_id = filter_organization_id)
    and (filter_subcategory_id is null or em.subcategory_id = filter_subcategory_id)
    and em.confidence >= 0.5
  group by em.subcategory_id, em.subcategory_name, em.evidence_item
  order by avg_confidence desc;
end;
$$;

-- Enable Row Level Security (RLS)
alter table documents enable row level security;
alter table evidence_matches enable row level security;
alter table scan_jobs enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table invitations enable row level security;
alter table users enable row level security;
