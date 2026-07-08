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

## Edit a Todo's Title In Place — 2026-07-04

**Brief:** Press `e` (or tap the title) to edit a todo's title inline; Enter/blur saves, Escape cancels, empty titles are rejected.
**Tests added:** 8 unit tests (2 server action, 6 client)
**Acceptance criteria:**
- [x] Pressing `e` while a todo is selected turns its title into a focused text input pre-filled with the current title (text selected)
- [x] Pressing Enter (or losing focus) saves the edited title via the `updateTodo` server action; change persists to the database
- [x] Pressing Escape cancels editing and restores the original title unchanged
- [x] An empty or whitespace-only title is rejected client- and server-side; the todo keeps its original title
- [x] While editing, the j/k/space/d/e list shortcuts do not fire (reuses the existing `isTypingTarget` guard)
- [x] Clicking/tapping the title text enters edit mode (non-keyboard affordance)
- [x] The editing field and saved title are mobile responsive (input fills width, title truncates, no overflow)
- [x] Unit tests cover entering edit mode via `e`, saving with Enter, cancelling with Escape, and rejecting an empty title

## Keyboard Shortcut Cheatsheet Overlay — 2026-07-06

**Brief:** Press `?` to open a mobile-responsive overlay listing every keyboard shortcut; dismiss via Escape, `?` again, or clicking outside.
**Tests added:** 6 unit tests
**Acceptance criteria:**
- [x] Pressing `?` (when not typing in an input/textarea/select/contenteditable) opens an overlay listing all keyboard shortcuts
- [x] The overlay lists j, k, space, e, d, and ? — each with a short human-readable description
- [x] Pressing Escape, pressing `?` again, or clicking outside the overlay closes it
- [x] While the overlay is open, the underlying list shortcuts (j/k/space/d/e) do not fire
- [x] The overlay does not open while typing in an input/textarea/select/contenteditable (reuses `isTypingTarget`)
- [x] The overlay is keyboard accessible: focus is managed by the base-ui Dialog and it is dismissible via keyboard alone
- [x] The overlay and its shortcut list are mobile responsive (w-[calc(100vw-2rem)] max-w-sm, no horizontal overflow)
- [x] Unit tests cover opening via `?`, closing via Escape, closing via `?` toggle, and suppression while typing in an input

## `/` to Focus the Add-Todo Input — 2026-07-08

**Brief:** Pressing `/` (when not already typing) jumps keyboard focus to the add-todo input, keeping the app fully keyboard-driven.
**Tests added:** 6 unit tests
**Acceptance criteria:**
- [x] Pressing `/` (when not typing in an input/textarea/select/contenteditable) moves focus to the add-todo input
- [x] The `/` character is not inserted — focusing consumes the key press (preventDefault)
- [x] While focus is in the add-todo input, list shortcuts (j/k/space/e/d/?) do not fire (reuses `isTypingTarget`)
- [x] Pressing `/` while already typing in an input/textarea/select/contenteditable behaves normally (no focus steal)
- [x] Pressing Escape while the add-todo input is focused blurs it, returning control to the list shortcuts
- [x] The `/` shortcut works whether or not any todos exist (including the empty-list state)
- [x] The `/` shortcut is documented in the keyboard cheatsheet overlay
- [x] Layout remains mobile responsive; tapping the input to focus it continues to work on touch devices
- [x] Unit tests cover focusing via `/`, suppression of the inserted character, and that `/` does not steal focus while typing
