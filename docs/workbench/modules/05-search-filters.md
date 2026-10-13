# 05 — Search & Filters

**Status:** Planned  
**Route:** `/dashboard/search`

## Overview

A debounced search interface with filter controls synced to the URL. Demonstrates patterns for performant client-side search, URL state management, and filter composition — common requirements in data-heavy applications.

## Planned features

- Text search with debounced input (300ms delay)
- Filter controls (dropdowns, toggles) for narrowing results
- All filter state synced to URL query parameters (shareable, bookmarkable)
- Result list with highlighted search terms
- Empty state and no-results state
- Search across a demo dataset (modules, users, or generated content)

## Open questions

- What data to search over (modules metadata, generated content, or a seed dataset)
- Which filters to offer (status, date range, category, etc.)
- Whether to use client-side filtering or server-side with API routes
- Pagination vs. infinite scroll for results

## Test cases

### Search
- [ ] Type in search box → results update after 300ms debounce
- [ ] Matching terms highlighted in results
- [ ] Clear search → all results shown
- [ ] Search with no matches → "No results" empty state
- [ ] Special characters in search query → handled without errors

### Filters
- [ ] Select a filter → results narrow, URL updates with query param
- [ ] Combine multiple filters → results reflect intersection
- [ ] Remove a filter → results expand, URL param removed
- [ ] Reset all filters → returns to default view

### URL sync
- [ ] Search term reflected in URL (e.g. `?q=auth`)
- [ ] Filter selections reflected in URL (e.g. `?status=live`)
- [ ] Copy URL with filters → paste in new tab → same filters applied
- [ ] Browser back/forward → filter state matches URL history
- [ ] Direct navigation to URL with params → filters pre-applied

### Performance
- [ ] Rapid typing → only one search triggered per debounce window
- [ ] Large result set → page remains responsive
- [ ] Filter change during pending search → latest state wins

### Edge cases
- [ ] Unauthenticated user → redirected to login
- [ ] Empty dataset → appropriate empty state shown
- [ ] Very long search query → handled gracefully
- [ ] URL with invalid filter values → ignored, defaults applied
