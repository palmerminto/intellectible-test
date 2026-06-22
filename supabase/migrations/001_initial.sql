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
create index if not exists chunks_embedding_idx on chunks using hnsw (embedding vector_cosine_ops);

-- Keep keyword search vectors in sync with chunk content.
create or replace function chunks_search_vector_trigger()
returns trigger
language plpgsql
as $$
begin
  new.search_vector := to_tsvector('english', coalesce(new.content, ''));
  return new;
end;
$$;

drop trigger if exists chunks_search_vector_update on chunks;
create trigger chunks_search_vector_update
before insert or update of content on chunks
for each row
execute function chunks_search_vector_trigger();

-- Vector similarity search over indexed chunks.
create or replace function match_chunks_vector(
  query_embedding vector(1536),
  match_count int default 10
)
returns table (
  chunk_id uuid,
  document_id uuid,
  filename text,
  content text,
  page integer,
  score double precision
)
language sql
stable
as $$
  select
    c.id as chunk_id,
    c.document_id,
    d.filename,
    c.content,
    c.page,
    1 - (c.embedding <=> query_embedding) as score
  from chunks c
  inner join documents d on d.id = c.document_id
  where d.status = 'ready'
    and c.embedding is not null
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- Keyword search over indexed chunks.
create or replace function match_chunks_keyword(
  query_text text,
  match_count int default 10
)
returns table (
  chunk_id uuid,
  document_id uuid,
  filename text,
  content text,
  page integer,
  score double precision
)
language sql
stable
as $$
  select
    c.id as chunk_id,
    c.document_id,
    d.filename,
    c.content,
    c.page,
    ts_rank(c.search_vector, websearch_to_tsquery('english', query_text)) as score
  from chunks c
  inner join documents d on d.id = c.document_id
  where d.status = 'ready'
    and c.search_vector @@ websearch_to_tsquery('english', query_text)
  order by score desc
  limit match_count;
$$;

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
