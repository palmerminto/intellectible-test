# Candidate Notes

## Phase 1: Skeleton (done)

Runnable foundation for the document search take-home. UI and API shapes are in place; retrieval logic comes next.

### What we built

- **Next.js app** (App Router, TypeScript) with a three-column workspace: upload/library, search + results, draft panel.
- **Mantine v8** wired up: PDF dropzone, toast notifications, j/k keyboard navigation on results.
- **Local Supabase** via Docker: `npm install` pulls the CLI; `npm run dev` starts Postgres + storage, applies migrations, and writes `.env.local` automatically.
- **Database schema** for documents, chunks (with vector column), drafts, and draft items, plus a private `pdfs` storage bucket.
- **API route shells** with typed responses: list documents, upload, search, drafts.

### What is stubbed (intentionally)

- Upload returns 501 (validates PDF only).
- Search always returns an empty result set.
- Draft items live in browser state for now, not persisted.
- No parse, chunk, embed, or hybrid search yet.

### Local dev

Requires Docker Desktop. Then:

```bash
npm install
npm run dev
```

App at localhost:3000. Supabase Studio at 127.0.0.1:54323.

### Next phase

Wire upload to storage, run the ingestion pipeline (parse → chunk → embed via OpenRouter), hybrid search, async document status, and persist drafts. See `.cursor/project/DECISIONS.md` for architecture choices.

## Phase 2: UX flows and interactions (done)

Implemented the UX plan before backend retrieval work. Flow map and acceptance review live in [`docs/UX-FLOWS.md`](docs/UX-FLOWS.md) and [`docs/UX-ACCEPTANCE.md`](docs/UX-ACCEPTANCE.md).

### What we built

- **UX copy refresh** in workspace components: natural-language search placeholder, evidence-oriented panel labelling, and state-specific messaging.
- **Document library states**: per-document `uploading`, `processing`, `ready`, `failed` with colour-coded badges, loaders, page counts, and error text.
- **Search gating**: search disabled until at least one document is `ready`, with explanation copy.
- **Results UX**: result count header, shortcut hints, relevance labels (not raw scores), visible `Add to evidence` buttons, searching/no-results/idle states.
- **Collected evidence panel**: renamed from Draft, item count badge, highlight on newly added passages, citation on every item.
- **Superhuman-style interactions**: optimistic upload feedback, document status polling while processing, clear selected-result states, and visible evidence actions.
- **Keyboard triage**: `j/k` to move, `Enter` to add to evidence (unchanged from skeleton, now paired with visible buttons).

### Still stubbed

- Backend retrieval not wired; search still returns empty until ingestion is implemented (unless demo query params are used).
- Evidence items remain in browser state, not persisted to `draft_items` yet.

### Demo query params

URL-controlled demo modes for presenting UX without backend wiring:

- `demoDocs=ready|processing|failed|mixed` — library/document status states (`processing` becomes `ready` after ~5s)
- `demoSearch=results|empty|searching|error` — auto-runs a demo search on load
- `demoEvidence=sample` — pre-populates Collected evidence

Examples:

- `/?demoDocs=ready&demoSearch=results`
- `/?demoDocs=mixed&demoSearch=searching&demoEvidence=sample`

### State refactor note

`WorkspacePage` was split into focused hooks so each concern is easier to test and explain in the interview:

- `useDemoParams()` — reads URL demo flags and builds API paths
- `useDocuments()` — library fetch, polling, and upload status handlers (optimistic rows tracked by upload token, not filename)
- `useSearch()` — query, search execution, and results state (including auto-run for `demoSearch`)
- `useEvidenceCollection()` — collected passages and add-to-evidence behaviour

Evidence collection previously tracked `addedResultIds` in a separate `Set`, parallel to `draftItems`. That duplicated source of truth and could drift (for example, demo seed data vs add-to-evidence clicks).

`addedResultIds` is now derived from `draftItems[].resultId`, so the panel and result cards always reflect the same state. Duplicate adds are guarded inside the `setDraftItems` updater.

## Phase 3: RAG server modules (done)

Added reusable server-side retrieval helpers under `src/lib/rag/` for PDF parsing, chunking, OpenRouter embeddings, Supabase persistence, and hybrid search. Upload and search routes are not wired yet.

### What we built

- **RAG modules** in `src/lib/rag/`: PDF parsing (`unpdf`), chunking, OpenRouter embeddings, Supabase document/chunk helpers, hybrid search orchestration, and pure search helpers in `search-utils.ts`.
- **SQL support** for vector/keyword search RPCs, `search_vector` trigger, and an HNSW index on chunk embeddings.
- **Vitest** test suite for pure helpers and orchestration logic (24 tests across unit and integration cases).
- **Cursor rules** for pure-function extraction and testing conventions in `.cursor/rules/`.

### Testing

Run the suite with:

```bash
npm run test
```

Use `npm run test:watch` during development. Tests are colocated as `*.test.ts` next to source files; real PDF parsing lives in `*.integration.test.ts`.

### Local database note

The search RPCs and `search_vector` trigger were added to [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql). If your local database was created before this change, reset it to pick up the new SQL:

```bash
npm run supabase:reset
```

### Prototype cuts

- Chunk overlap applies within a page, not across page boundaries.
- Chunk replace deletes existing rows before insert; the upload route marks the document `failed` if indexing throws.

## Phase 4: Upload ingestion and document library (done)

Wired the upload route to Supabase storage and the inline ingestion pipeline, then fixed the library so uploaded documents actually appear and can be removed.

### What we built

- **Upload route** (`POST /api/documents/upload`): validates PDFs (MIME, `.pdf` filename, `%PDF` header, 25 MB limit), stores the file in the private `pdfs` bucket, runs parse → chunk → embed → index inline, and marks documents `ready` or `failed`.
- **Document listing** (`GET /api/documents`): returns persisted documents from Supabase when not in demo mode, newest first.
- **Document delete** (`DELETE /api/documents/[id]`): removes the document row, cascaded chunks, and stored PDF (storage cleanup is best-effort).
- **Library UX**: remove button on each document card with in-flight loading guard to prevent double deletes.
- **Shared upload helpers** in `src/lib/upload/upload-utils.ts` for size limits and PDF validation used by both API and dropzone.
- **Service-role grants migration** (`002_service_role_grants.sql`) so server-side inserts work against local Supabase.

### Still stubbed

- Evidence items remain in browser state, not persisted to `draft_items` yet.
- Ingestion runs inline in the upload request; no background queue yet.

### Local database note

If uploads fail with `permission denied for table documents`, apply pending migrations:

```bash
npx supabase migration up
```

Or reset entirely:

```bash
npm run supabase:reset
```

### Prototype cuts

- Inline ingestion blocks the upload request until indexing finishes.
- Delete has no confirmation modal; use × per document or `npm run supabase:reset` for a full wipe.
- RLS is not enabled on app tables yet; required before any non-local deployment.

## Phase 5: Hybrid search (done)

Wired the search API to the existing RAG retrieval pipeline so real queries return cited results from indexed documents.

### What we built

- **Search route** (`GET /api/search`): validates `q`, preserves all `demoSearch` demo modes, and calls `searchDocuments()` for real queries.
- **Hybrid retrieval path**: OpenRouter query embedding → pgvector similarity search → Postgres full-text search → reciprocal rank fusion → cited snippets with filename, page, score, and lightweight term highlighting.
- **Route tests** in `src/app/api/search/route.test.ts` covering validation, demo behaviour, successful real search, and error handling.

### Still stubbed

- Evidence items remain in browser state, not persisted to `draft_items` yet.
- No reranker, retrieval evaluation set, or OCR for scanned PDFs.

### Validation

```bash
npm run test
npm run lint
npm run typecheck
```

Manual happy path: upload a text PDF, wait for `ready`, search an exact phrase and a semantic query, confirm results show filename/page/snippet/highlighting and `Add to evidence` works.

### Prototype cuts

- Fixed RRF merge with no cross-encoder reranking.
- Keyword highlighting uses simple `[term]` markers, not rich HTML markup.
- Search errors surface a safe message only; provider details stay server-side.
