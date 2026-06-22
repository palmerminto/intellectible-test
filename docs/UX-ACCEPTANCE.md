# UX Acceptance Review

Checklist against the Document Search UX plan. All items satisfied by the current prototype UI.

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| New user knows what to do before upload | Pass | Dropzone copy targets RFPs/amendments/proposals; library empty state explains indexing |
| Per-document processing/ready/failed visible | Pass | `DocumentLibrary` status badges, loaders, page count, error messages |
| Search cannot silently fail when nothing indexed | Pass | Search disabled with `disabledHint` until a document is `ready` |
| Every result shows passage, source, page, usefulness | Pass | Snippet, citation badge, relevance label (`Strong match` / `Related passage`) |
| Add to evidence visible without shortcuts | Pass | `Add to evidence` button on every result card |
| Evidence panel preserves citations | Pass | `Collected evidence` panel with `filename · p.X` on each item |
| Keyboard flow: search, triage, collect | Pass | `j/k` + `Enter` in results |
| Mouse flow discovers same actions | Pass | Buttons, dropzone, search field |
| Immediate upload feedback | Pass | Optimistic `uploading` row before API responds |
| Search loading state | Pass | `SearchResults` `searching` state with loader |
| No-results recovery | Pass | Dedicated copy suggesting broader terms or more uploads |
| Single-screen interaction model | Pass | Primary actions are directly visible on-page |

## Conscious non-goals (unchanged)

- No Figma pass
- No document previewer
- No per-document search filters in v1
- No OCR/table-specific UI beyond failure messaging
