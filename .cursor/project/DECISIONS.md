# Document Search Take-Home: Decisions & Context

## What this is
Take-home for Intellectible (Software Engineer). Build a document search feature: drop in
PDFs, search across them, intuitive web interface. Deadline Wednesday 24/06 afternoon.
~3 hour build in Cursor, AI-assisted is expected. Present and defend to technical founders
(CTO Reuben Carter, AI/ML background).

## The user (this shapes everything)
Intellectible is an AI-native revenue operations platform for enterprise service providers:
proposal teams, capture managers, grant writers, RFP shops, government contractors. Their
pain is document hell: 60-page RFPs, last-minute amendments, version_99_FINAL.docx. They
already run RAG with IP-privacy. The document library (upload, parse, index, search, reuse
PDFs) is a core primitive of their real product.

Implication: this take-home is a slice of their actual platform. Build it as the retrieval
layer that feeds a proposal workflow, not a standalone search box.

## Product framing / stickiness
Search is never the destination for these users. They hunt a passage to pull into a draft.
So results must be actionable: cite into a draft, save to a collection. That workflow hook
is what the interviewer meant by "becomes part of the customer's workflow." It is the
differentiator.

What quality means to this audience: provenance over cleverness (source doc + page,
highlighted), semantic recall not just keyword, trust under pressure (visible states, clear
data isolation).

## Scope (3 hours)
Build: drag-drop upload with visible async parse/embed status, hybrid search with cited
snippets, a results UI that feels good, a draft collection panel.

Cut, cover in write-up and diagrams: OCR for scanned PDFs, table extraction, real queue
infra, multi-tenant isolation, retrieval eval (recall@k). Name each as a conscious cut with
one line on how you would do it. Multi-tenant isolation gets a paragraph (their users are
IP-sensitive and government-facing).

## UX states (the spine, define before building)
1. Empty: no docs, the drag target is the hero.
2. Uploading/parsing: per-doc progress. The visible answer to "how would you handle
   long-running tasks."
3. Ready: docs listed with status, search live.
4. Results: cards with highlighted passage, source doc, page, relevance signal.
5. Draft: collected passages with citations. The workflow hook.

UX is done in code via Cursor; the running prototype is the deliverable. Low-fi wireframes
only (Excalidraw or tldraw) to show process. No Figma.

## Architecture decisions
- Stack: Next.js full-stack, single repo, App Router, TypeScript. API routes for backend,
  no separate Python service.
- Storage: Supabase. Postgres + pgvector for chunks/embeddings, Supabase Storage for PDFs.
  Maps to Cloud SQL or AlloyDB + GCS on GCP in production.
- Models: all via OpenRouter (OpenAI-compatible, base url https://openrouter.ai/api/v1).
  Embeddings at /embeddings, model openai/text-embedding-3-small (1536 dims, must match the
  pgvector column). Chat model for draft generation. Rerank endpoint available but out of
  scope for the build. Mirrors the Nuuri model-agnostic OpenRouter layer.
- Pipeline (keep as separate, commented modules): parse (per-page text via unpdf or pdf.js,
  keep page numbers) -> chunk (~500-800 tokens, overlap, tag {docId, page}) -> embed (batch
  to OpenRouter) -> index (pgvector + Postgres full-text).
- Search: hybrid. Vector cosine (pgvector) + full-text (keyword) combined with reciprocal
  rank fusion. Return top results with snippet + doc + page.
- Async: upload returns immediately, doc status processing -> ready, frontend polls.
  Production = Cloud Tasks or Pub/Sub + Cloud Run worker.

## Resolved open decisions
1. Postgres: Supabase (Postgres + pgvector + storage in one).
2. Draft feature: collection is core; grounded generation is a thin, degradable stretch
   (last 20-30 min). Generation strictly grounded in retrieved passages, citations
   preserved, no free model knowledge.
3. Rerank: out of the build, in the architecture story. Written behind a flag if time allows.
Stretch priority: generation first, rerank second.

## Interview talking points (defend these)
- Why hybrid beats keyword-only or vector-only.
- Chunking sets both retrieval quality and citation granularity.
- Grounded generation vs model wrapper (the founders' explicit distinction).
- Async pattern now, queue infra in production.
- Multi-tenant isolation for IP-sensitive and government users.
- GCP scaling path (Cloud Run, Pub/Sub, GCS, AlloyDB), grounded in real Nuuri experience.

## Voice (for any generated UI copy or write-up prose)
Direct, no corporate filler, no AI slop. No em dashes.
