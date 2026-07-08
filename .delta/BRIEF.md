# Feature Brief: `/` to Focus the Add-Todo Input

**Date:** 2026-07-08
**Priority:** High
**Estimated complexity:** Small

## What to build
A power user should be able to jump straight to adding a new todo from anywhere on the page by pressing `/`, without reaching for the mouse. The key press moves focus into the "Add a todo..." input so they can start typing immediately, keeping the app fully keyboard-driven.

## Acceptance criteria
- [ ] Pressing `/` (when not already typing in an input/textarea/select/contenteditable) moves keyboard focus to the add-todo input
- [ ] The `/` character is not inserted into the input — focusing consumes the key press
- [ ] While focus is in the add-todo input, the list shortcuts (j/k/space/e/d/?) do not fire (reuses the existing `isTypingTarget` guard)
- [ ] Pressing `/` while already typing in any input/textarea/select/contenteditable behaves normally (inserts the character, does not steal focus)
- [ ] Pressing `Escape` while the add-todo input is focused blurs it, returning control to the list shortcuts
- [ ] The `/` shortcut works whether or not any todos exist (including the empty-list state)
- [ ] The `/` shortcut is documented in the keyboard cheatsheet overlay alongside the existing shortcuts
- [ ] Layout remains mobile responsive; tapping the input to focus it continues to work on touch devices
- [ ] Unit tests cover focusing via `/`, suppression of the inserted character, and that `/` does not steal focus while already typing in an input

## Constraints
- Stack: Next.js, Tailwind + shadcn, Prisma + SQLite (local) / Neon Postgres (prod), Vitest + Playwright
- Read the relevant guide in `node_modules/next/dist/docs/` before writing code — this Next.js has breaking changes
- Keyboard-first and speed-first: focusing must feel instant
- Mobile responsive required
- Use only the allowed dependencies in `config.yml`; do not add new packages
- Honour the `avoid:` list — no auth, no sharing, no push notifications, no drag-and-drop
- Reuse the existing `isTypingTarget` guard and global keydown handler in `todo-list-client.tsx`

## Out of scope
- Remapping or configuring which key focuses the input
- Any change to how todos are created, validated, or persisted
- A separate search box or command palette (search by title is a later backlog item)
- Scroll-into-view / smooth-scroll behaviour beyond native browser focus
