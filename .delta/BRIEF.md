# Feature Brief: Keyboard Navigation (j/k/space/d)

**Date:** 2026-05-21
**Priority:** High
**Estimated complexity:** Medium

## What to build
Power users should be able to drive the todo list entirely from the keyboard, vim-style. Pressing `j`/`k` moves a visible selection cursor down/up through the list. With a todo selected, pressing `space` toggles it complete and pressing `d` deletes it. This makes deltado feel native to developers who live on the keyboard.

## Acceptance criteria
- [ ] When at least one todo exists, exactly one todo is "selected" and visually distinguished (e.g. background tint, ring, or left bar) so the user can see which todo the keyboard will act on.
- [ ] Pressing `j` moves the selection to the next todo; pressing `k` moves it to the previous todo. Behaviour at the ends of the list is consistent (either clamp at top/bottom or wrap — pick one and stick with it).
- [ ] Pressing `space` toggles the completed state of the currently selected todo (same effect as clicking its checkbox). The page must not scroll when space is pressed in this context.
- [ ] Pressing `d` deletes the currently selected todo (same effect as clicking its delete button). Selection moves to a sensible neighbour (next item, or previous if it was the last).
- [ ] Shortcuts do **not** fire while the add-todo input (or any other text input) is focused — typing "j" in the input must type the letter, not move the cursor.
- [ ] If the list is empty, the shortcuts are inert (no errors, no console noise).
- [ ] Layout remains mobile responsive. On mobile (no hardware keyboard) the existing tap-to-toggle and tap-to-delete still work; selection state must not break touch UX.
- [ ] At least one unit or e2e test covers the j/k/space/d behaviour end-to-end.

## Constraints
- Stack: Next.js (this project's version — read `node_modules/next/dist/docs/` before writing code), Tailwind + shadcn, Prisma + SQLite, Vitest + Playwright.
- Mobile responsive required.
- Use only the allowed dependencies in `config.yml`; do not add new packages.
- Honour the `avoid:` list — no auth, no sharing, no push notifications, no drag-and-drop.
- Interactions must feel instant — selection updates and toggle/delete should be optimistic or fast enough to feel synchronous.

## Out of scope
- Any other shortcut keys (`?` cheatsheet, `/` to focus input, `e` to edit, `u` to undo, etc.) — those are separate backlog items.
- A visible help/legend UI listing the shortcuts.
- Filtering, sorting, priority, due dates, or any data model changes.
- Drag-and-drop reordering.
- Persisting which item is selected across reloads.
