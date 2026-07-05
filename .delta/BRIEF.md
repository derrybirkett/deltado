# Feature Brief: Edit a Todo's Title In Place

**Date:** 2026-07-04
**Priority:** High
**Estimated complexity:** Small

## What to build
A user who made a typo or wants to reword a todo should be able to fix it without deleting and re-adding it. Pressing `e` on the selected todo turns its title into an inline editable field; the user edits, presses Enter to save or Escape to cancel. Touch users get an equivalent tap affordance so the feature works on mobile too.

## Acceptance criteria
- [ ] Pressing `e` while a todo is selected turns that todo's title into a focused text input pre-filled with the current title (existing text selected/ready to overwrite)
- [ ] Pressing Enter (or the input losing focus) saves the edited title; the change persists to the database and survives a page reload
- [ ] Pressing Escape cancels editing and restores the original title unchanged
- [ ] An empty or whitespace-only title is rejected: the todo keeps its original title and is never left blank
- [ ] While a todo is being edited, the j/k/space/d/e list shortcuts do not fire (typing in the field is unaffected)
- [ ] A non-keyboard affordance lets touch/mouse users enter edit mode for a todo (e.g. tapping/clicking the title text)
- [ ] The editing field and saved title are mobile responsive — input fills available width and does not overflow on small screens
- [ ] Unit tests cover: entering edit mode via `e`, saving with Enter, cancelling with Escape, and rejecting an empty title

## Constraints
- Stack: Next.js (read `node_modules/next/dist/docs/` before writing code), Tailwind + shadcn, Prisma + SQLite (local) / Neon Postgres (prod), Vitest + Playwright
- Mobile responsive required
- Keyboard-first: every part of the flow must be reachable without a mouse
- Use only the allowed dependencies in `config.yml`; do not add new packages
- Honour the `avoid:` list — no auth, no sharing, no push notifications, no drag-and-drop
- Reuse the existing `isTypingTarget` guard in `todo-list-client.tsx` so shortcuts stay inert while editing
- Add a single `updateTodo(id, title)` server action; do not restructure existing actions

## Out of scope
- Editing any field other than the title (no priority, due date, or completed toggle in the edit flow)
- Rich text, markdown, or multiline titles
- Drag-and-drop or reordering
- Undo/history of edits
- Autosave-on-every-keystroke (save happens on Enter/blur only)
