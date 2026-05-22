# Feature Brief: Filter Todos by Status

**Date:** 2026-05-19
**Priority:** High
**Estimated complexity:** Small

## What to build
Users need a way to view only the todos they care about right now. Add a filter bar with three options — All, Active, and Completed — so the user can instantly narrow the list without leaving the page. The active filter should be visually clear at a glance.

## Acceptance criteria
- [ ] A filter bar with "All", "Active", and "Completed" options is visible above the todo list
- [ ] "All" is selected by default and shows every todo
- [ ] "Active" shows only todos where completed = false
- [ ] "Completed" shows only todos where completed = true
- [ ] The currently selected filter is visually distinguished (e.g. underline, bold, or filled pill)
- [ ] If the filtered list is empty, a helpful empty-state message is shown (e.g. "No active todos")
- [ ] Filter state is preserved in the URL query string (e.g. `?filter=active`) so the user can bookmark or share a filtered view
- [ ] Filter bar is fully keyboard accessible (Tab to reach, Enter/Space to activate)
- [ ] Layout is mobile responsive — filter options stack or wrap cleanly on small screens

## Constraints
- Stack: Next.js App Router, Tailwind + shadcn, Prisma + SQLite/Neon
- Mobile responsive required
- No new dependencies
- Filtering logic should live server-side (pass filter as a search param to a Server Component) — avoid client-side state where possible

## Out of scope
- Text search / keyword filtering
- Filtering by priority or due date
- Saving the last-used filter to the database
- Any changes to the Prisma schema
