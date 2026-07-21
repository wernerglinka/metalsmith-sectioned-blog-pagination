# Theory of Operation

This document explains how `metalsmith-sectioned-blog-pagination` works and why
it is built the way it is. The README covers usage; this covers design.

## Problem

Sites built with a modular/sectioned page paradigm compose a page from an array
of `sections` in frontmatter rather than from a single body. A blog landing page
is one such page, and it needs to exist in several numbered variants
(`/blog/`, `/blog/2/`, `/blog/3/`) — each showing a different slice of posts —
while sharing the same section layout. The pagination data (which slice, which
page number, how many pages) has to live *inside* the section that renders the
list, because that is where the template reads it. This plugin generates those
page variants from one main template and injects the paging data into the
right section of each.

## Approach

The plugin runs before Markdown/Permalinks/Layouts, while pages are still
frontmatter objects. Given a main template (default `blog.md`) that contains a
section flagged `hasPagingParams: true`, it:

1. **Validates** options and that the main template exists (`utils/validation.js`).
2. **Counts posts** — either by scanning `blogDirectory` or, when
   `collectionName` is set, by reading the named `@metalsmith/collections`
   collection from metadata.
3. **Computes page count** from the post count and `pagesPerPage`.
4. **Clones the template** once per page (`utils/clone.js`, a deep clone so
   pages don't share section objects), and for each clone fills in the section's
   `pagingParams` (`utils/update.js`): `numberOfBlogs`, `numberOfPages`,
   `pageLength`, `pageStart`, `pageNumber`.
5. **Writes** the generated pages into the files object at the paginated paths
   and removes the original template so it isn't emitted twice.

## Key decisions

- **Deep clone per page.** Each generated page must own its section objects; a
  shallow copy would make all pages share one `pagingParams` and show identical
  data. The clone utility exists specifically to prevent that leak, and a test
  asserts sections are not mutated across pages.
- **Update-in-place, then fill gaps.** If any of the five paging keys already
  exist anywhere in the section (author-declared placeholders), they are updated
  where they are; only missing keys are added under `pagingParams`. Before v1.4.0
  the placeholders were mandatory — a bare `hasPagingParams: true` produced no
  values. Now the flag alone is sufficient.
- **`collectionName` vs directory scan.** Scanning `blogDirectory` counts every
  file there, which over-counts when the directory also holds non-post pages
  (category landings, generated pages). `collectionName` counts only true
  collection members, so the page count matches the real post set.
- **Runs early.** Because it manipulates frontmatter (`sections`), it must run
  before Markdown converts bodies and before Permalinks/Layouts consume the
  data.

## Invariants and failure modes

- **Main template must exist.** `validateFiles` fails the build if the named
  `mainTemplate` is absent rather than silently producing nothing.
- **Options are copied, not mutated.** Defaults merge into a fresh `opts` object
  per invocation.
- **Errors propagate.** The plugin body is wrapped in try/catch and routes any
  throw to `done(error)`.
- **No shared section state across pages.** Guaranteed by the deep clone; this
  is the single most important correctness property.
