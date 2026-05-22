# Feature Brief: Filter todos by status

**Date:** 2026-05-22
**Priority:** High
**Estimated complexity:** Small

## What to build
Users can narrow the visible list to All, Active, or Completed todos. When a filter is active, only matching todos appear; the empty state copy reflects the chosen filter (e.g. "No active todos."). The active filter persists across page reloads so the user returns to the view they were last using.

## Acceptance criteria
- [ ] Three filter controls are visible above the todo list: "All", "Active", "Completed"
- [ ] Selecting "Active" shows only todos where completed = false
- [ ] Selecting "Completed" shows only todos where completed = true
- [ ] Selecting "All" shows every todo (current default behaviour)
- [ ] The currently selected filter is visually distinguishable from the others (e.g. underline, background, or weight)
- [ ] The selected filter is preserved across a full page reload
- [ ] Each filter control is reachable and activatable using only the keyboard (Tab + Enter/Space)
- [ ] The empty state message reflects the active filter (e.g. "No completed todos yet." when Completed is selected and there are none)
- [ ] Adding a new todo while "Completed" is selected does not visually break the list (new todo is filtered out as expected)
- [ ] Layout remains usable on a 375px-wide viewport (filter controls do not overflow or wrap awkwardly)
- [ ] At least one unit test covers the filter logic and one e2e test covers switching filters

## Constraints
- Stack: Next.js (see AGENTS.md — this version may differ from training data; consult `node_modules/next/dist/docs/`), Tailwind + shadcn, Prisma + sqlite, Vitest + Playwright
- Mobile responsive required (test at 375px)
- Keyboard-first: filter controls must be keyboard-operable
- No new dependencies outside the allowed list in config.yml
- No schema changes — filtering should be derived from the existing `completed` field
- No authentication, no sharing, no push notifications, no drag-and-drop

## Out of scope
- Filtering by text/search (separate backlog item)
- Filtering by due date or priority (those fields don't exist yet)
- Bulk actions on filtered results (e.g. "clear all completed")
- Custom user-defined filters or saved views
- Sorting options
- URL-based deep linking to a specific filter (use localStorage or a server-side cookie — whatever is simplest and reload-stable)
