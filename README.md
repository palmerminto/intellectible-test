# Intellectible Document Search

Skeleton Next.js app for the Intellectible take-home: PDF upload, hybrid search, and draft collection.

## Stack

- Next.js App Router, TypeScript, `src/` directory
- Mantine v8 (Dropzone, Notifications)
- Supabase (Postgres + pgvector + Storage)
- `react-hotkeys-hook` for j/k result navigation

## Prerequisites

- **Node.js** 20+
- **Docker Desktop** (for local Supabase)

## Setup

1. Install dependencies (also prepares the Supabase CLI via `postinstall`):

```bash
npm install
```

2. Start development (starts local Supabase, writes `.env.local`, then Next.js):

```bash
npm run dev
```

On first run, Docker may download Supabase images. Migrations in [`supabase/migrations/`](supabase/migrations/) are applied automatically.

Open [http://localhost:3000](http://localhost:3000). Supabase Studio is at [http://127.0.0.1:54323](http://127.0.0.1:54323).

3. Optional: add `OPENROUTER_API_KEY` to `.env.local` for embeddings later. Supabase keys are refreshed on each `npm run dev`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local Supabase + Next.js dev server |
| `npm run build` | Production build (no Supabase required) |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run supabase:start` | Start local Supabase only |
| `npm run supabase:stop` | Stop local Supabase containers |
| `npm run supabase:reset` | Reset DB and re-run migrations |
| `npm run supabase:status` | Show local URLs and keys |
| `npm run env:sync` | Write Supabase keys to `.env.local` |

## Cloud Supabase (optional)

To use a hosted project instead of Docker, set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and run the migration in the Supabase SQL editor. Use `npx next dev` directly if you do not want the local stack to start.

## API shells

| Route | Status |
|-------|--------|
| `GET /api/documents` | Returns `{ documents: [] }` |
| `POST /api/documents/upload` | Validates PDF, returns 501 (not implemented) |
| `GET /api/search?q=` | Returns `{ results: [] }` |
| `GET/POST /api/drafts` | Stub list / create |

## Demo query params

Use these query params in the app URL to simulate UI states with dummy API data:

- `demoDocs=ready|processing|failed|mixed` (`processing` transitions to `ready` after ~5s)
- `demoSearch=results|empty|searching|error` (auto-runs a demo search on load; `searching` delays ~2.5s then returns results)
- `demoEvidence=sample` (pre-populates Collected evidence)

Examples:

- `http://localhost:3000/?demoDocs=mixed`
- `http://localhost:3000/?demoDocs=ready&demoSearch=results`
- `http://localhost:3000/?demoDocs=ready&demoSearch=results&demoEvidence=sample`
- `http://localhost:3000/?demoSearch=searching`

## What is not built yet

Parse/chunk/embed pipeline, hybrid search, async ingestion, draft persistence, and auth. See [`.cursor/project/DECISIONS.md`](.cursor/project/DECISIONS.md).
