# Completed Features

## Basic Todo CRUD — initial setup

**Brief:** Core todo list with add, toggle complete, and delete.
**Tests added:** 5 unit tests
**Acceptance criteria:**
- [x] User can add a todo by typing and pressing Enter or clicking Add
- [x] User can toggle a todo complete (strikethrough)
- [x] User can delete a todo

## Filter todos by status — 2026-05-22

**Brief:** Users can narrow the visible list to All, Active, or Completed; selection persists across reloads via localStorage.
**Tests added:** 21 unit tests (11 filter logic + 10 TodosView component) and 3 e2e tests
**Acceptance criteria:**
- [x] Three filter controls are visible above the todo list: "All", "Active", "Completed"
- [x] Selecting "Active" shows only todos where completed = false
- [x] Selecting "Completed" shows only todos where completed = true
- [x] Selecting "All" shows every todo (current default behaviour)
- [x] The currently selected filter is visually distinguishable from the others (background + font-weight, plus aria-selected)
- [x] The selected filter is preserved across a full page reload (localStorage key `deltado:filter`)
- [x] Each filter control is reachable and activatable using only the keyboard (Tab + Enter/Space)
- [x] The empty state message reflects the active filter (e.g. "No completed todos yet." when Completed is selected and there are none)
- [x] Adding a new todo while "Completed" is selected does not visually break the list (new todo is filtered out as expected)
- [x] Layout remains usable on a 375px-wide viewport (filter controls do not overflow or wrap awkwardly)
- [x] At least one unit test covers the filter logic and one e2e test covers switching filters
