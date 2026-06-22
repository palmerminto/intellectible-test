# Candidate Notes

## Phase 1: Skeleton (done)

Runnable foundation for the document search take-home. UI and API shapes are in place; retrieval logic comes next.

### What we built

- **Next.js app** (App Router, TypeScript) with a three-column workspace: upload/library, search + results, draft panel.
- **Mantine v8** wired up: command palette (Spotlight), PDF dropzone, toast notifications, j/k keyboard navigation on results.
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
