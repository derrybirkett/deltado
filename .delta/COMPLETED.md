# Completed Features

## Basic Todo CRUD — initial setup

**Brief:** Core todo list with add, toggle complete, and delete.
**Tests added:** 5 unit tests
**Acceptance criteria:**
- [x] User can add a todo by typing and pressing Enter or clicking Add
- [x] User can toggle a todo complete (strikethrough)
- [x] User can delete a todo

## Filter Todos by Status — 2026-05-19

**Brief:** Add a filter bar (All / Active / Completed) so users can narrow the todo list by status; filter state lives in the URL query string.
**Tests added:** 9 unit tests, 7 e2e tests
**Acceptance criteria:**
- [x] A filter bar with "All", "Active", and "Completed" options is visible above the todo list
- [x] "All" is selected by default and shows every todo
- [x] "Active" shows only todos where completed = false
- [x] "Completed" shows only todos where completed = true
- [x] The currently selected filter is visually distinguished (filled pill + aria-current="page")
- [x] If the filtered list is empty, a helpful empty-state message is shown ("No active todos." / "No completed todos.")
- [x] Filter state is preserved in the URL query string (?filter=active) so the user can bookmark or share a filtered view
- [x] Filter bar is fully keyboard accessible (Tab to reach, Enter/Space to activate via native links)
- [x] Layout is mobile responsive — filter options wrap cleanly on small screens (flex-wrap)
