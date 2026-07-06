# Feature Brief: Keyboard Shortcut Cheatsheet Overlay

**Date:** 2026-07-06
**Priority:** High
**Estimated complexity:** Small

## What to build
The app is keyboard-first but its shortcuts (j/k, space, d, e) are invisible — a new user has no way to discover them. Add a cheatsheet overlay that pops up when the user presses `?`, listing every available keyboard shortcut and what it does. The user can dismiss it just as quickly, keeping the app clutter-free until help is actually needed.

## Acceptance criteria
- [ ] Pressing `?` (when not typing in an input/textarea/select/contenteditable) opens an overlay listing all keyboard shortcuts
- [ ] The overlay lists, at minimum: `j` (move selection down), `k` (move selection up), `space` (toggle complete), `e` (edit title), `d` (delete), and `?` (this help) — each with a short human-readable description
- [ ] Pressing `Escape`, pressing `?` again, or clicking outside the overlay closes it
- [ ] While the overlay is open, the underlying list shortcuts (j/k/space/d/e) do not fire
- [ ] The overlay does not open while the user is typing in an input, textarea, select, or contenteditable field (reuses the existing `isTypingTarget` guard)
- [ ] The overlay is keyboard accessible: focus is managed sensibly and it is dismissible via keyboard alone
- [ ] The overlay and its shortcut list are mobile responsive — readable and fully visible on a narrow phone screen, no horizontal overflow
- [ ] Unit tests cover opening via `?`, closing via `Escape`, closing via `?` toggle, and that the `?` handler is suppressed while typing in an input

## Constraints
- Stack: Next.js (read `node_modules/next/dist/docs/` before writing code), Tailwind + shadcn, Prisma + SQLite (local) / Neon Postgres (prod), Vitest + Playwright
- Mobile responsive required
- Keyboard-first: opening and closing must be fully achievable without a mouse
- Minimal UI: overlay stays hidden until invoked; no persistent help chrome cluttering the main view
- Use only the allowed dependencies in `config.yml`; do not add new packages (prefer shadcn/base-ui primitives already in the repo)
- Honour the `avoid:` list — no auth, no sharing, no push notifications, no drag-and-drop
- Reuse the existing `isTypingTarget` guard in `todo-list-client.tsx`

## Out of scope
- Adding, changing, or remapping any of the actual keyboard shortcuts themselves
- Configurable / user-customizable keybindings
- A persistent on-screen help button or footer (invocation is via `?` only)
- Any new shortcuts beyond `?` (e.g. `/` to focus add input — that is a separate backlog item)
- Persisting "help already seen" state or first-run tutorials
