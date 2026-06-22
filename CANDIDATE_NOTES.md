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

- Backend retrieval not wired; search still returns empty until ingestion is implemented.
- Evidence items remain in browser state, not persisted to `draft_items` yet.
