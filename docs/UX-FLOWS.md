# Document Search UX Flows

Low-fi flow map for the Intellectible take-home prototype. Each state maps to a visible UI surface.

## Flow Overview

```
Empty library → Upload PDFs → Processing → Ready → Search → Results / No results
                                                      ↓
                                            Collected evidence
Processing → Failed (per document, workspace continues)
```

## States

### 1. Empty
- **Trigger:** No documents in library.
- **Surface:** Dropzone is the hero in the left navbar. Library shows helper copy.
- **User action:** Drop or browse for PDFs.
- **Copy:** RFPs, amendments, proposals.

### 2. Uploading (client)
- **Trigger:** User drops files; request in flight.
- **Surface:** Optimistic row in library with `Uploading` badge.
- **Feedback:** Immediate appearance in library.

### 3. Processing
- **Trigger:** Upload accepted; parse/chunk/embed in progress.
- **Surface:** Library row with `Processing` badge. Workspace polls until status changes.
- **Feedback:** Per-document status, not a global spinner only.

### 4. Ready
- **Trigger:** Document indexed successfully.
- **Surface:** Library row with `Ready` badge and page count when available. Search becomes available.
- **User action:** Enter a natural-language query.

### 5. Search unavailable
- **Trigger:** No documents in `ready` state.
- **Surface:** Search input disabled with explanation below.
- **Copy:** Wait for indexing to finish.

### 6. Searching
- **Trigger:** User submits query.
- **Surface:** Results area shows loading state. Search button shows spinner.

### 7. Results
- **Trigger:** Search returns matches.
- **Surface:** Result cards with snippet, citation, relevance label, `Add to evidence` button.
- **Interaction:** `j/k` moves selection, `Enter` adds to evidence. First result selected by default.

### 8. No results
- **Trigger:** Search returns zero matches.
- **Surface:** Recovery copy in results area.
- **Copy:** Broaden query or upload more documents.

### 9. Collected evidence
- **Trigger:** User adds passages from results.
- **Surface:** Right panel with cited items, item count, toast confirmation.
- **Done state:** Reusable cited evidence set (generation is stretch).

### 10. Failed
- **Trigger:** Ingestion error for one document.
- **Surface:** Library row with `Failed` badge and short error message.
- **Behaviour:** Other documents and search continue to work.

## Interaction model

| Action | Shortcut | Visible fallback |
|--------|----------|------------------|
| Submit search | Enter in input | Click Search button |
| Move results | j / k | Click card |
| Add to evidence | Enter in results | Add to evidence button |

## Component mapping

| State | Component |
|-------|-----------|
| Empty / upload | `DocumentDropzone`, `DocumentLibrary` |
| Processing / ready / failed | `DocumentLibrary` |
| Search gating / polling | `WorkspacePage` |
| Results / no results / searching | `SearchResults` |
| Evidence collection | `DraftPanel` |
