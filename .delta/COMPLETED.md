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

## Keyboard Navigation (j/k/space/d) — 2026-05-21

**Brief:** Vim-style keyboard navigation: j/k move a visible selection cursor, space toggles, d deletes the selected todo.
**Tests added:** 7 unit tests
**Acceptance criteria:**
- [x] When at least one todo exists, exactly one todo is selected and visually distinguished (background tint + left bar)
- [x] `j` moves selection down, `k` moves up; behaviour is clamped at the top and bottom of the list
- [x] `space` toggles the selected todo's completed state and prevents the default page-scroll behaviour
- [x] `d` deletes the selected todo; selection moves to the previous item if the last one was deleted, otherwise stays in place
- [x] Shortcuts are ignored while an `<input>`, `<textarea>`, `<select>` or contenteditable element is focused
- [x] Shortcuts are inert on an empty list (no errors, no console noise)
- [x] Layout remains mobile responsive; touch interactions on the checkbox and delete button continue to work
- [x] Unit tests cover j/k/space/d behaviour end-to-end
