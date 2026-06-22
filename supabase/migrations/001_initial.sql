-- Initial schema for document search skeleton.
-- Run via Supabase CLI or SQL editor.

create extension if not exists vector;

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  storage_path text not null,
  mime_type text not null default 'application/pdf',
  size_bytes bigint,
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'ready', 'failed')),
  error_message text,
  page_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  content text not null,
  page integer not null,
  chunk_index integer not null,
  embedding vector(1536),
  search_vector tsvector,
  created_at timestamptz not null default now()
);

create index if not exists chunks_document_id_idx on chunks (document_id);
create index if not exists chunks_search_vector_idx on chunks using gin (search_vector);

create table if not exists drafts (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists draft_items (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references drafts (id) on delete cascade,
  chunk_id uuid references chunks (id) on delete set null,
  content_snapshot text not null,
  source_filename text not null,
  page integer not null default 1,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists draft_items_draft_id_idx on draft_items (draft_id);

insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', false)
on conflict (id) do nothing;
