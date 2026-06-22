# Feature Brief: Character Counter for Todo Input

**Date:** 2026-06-22
**Priority:** Medium
**Estimated complexity:** Small

## What to build
Add a live character counter below the todo input field that shows how many characters the user has typed and the maximum allowed (160 characters). The counter should update as the user types and turn red when they are near or over the limit, providing instant feedback before submission.

## Acceptance criteria
- [ ] A character counter is displayed below the add-todo input field
- [ ] Counter shows current character count and maximum: e.g. "42 / 160"
- [ ] Counter updates on every keystroke without delay
- [ ] Counter text turns red (or uses a destructive colour token) when count exceeds 140 characters
- [ ] The form submission is disabled (button disabled + aria-disabled) when count exceeds 160 characters
- [ ] Counter is hidden when the input is empty (count = 0)
- [ ] Counter is accessible: uses aria-live="polite" so screen readers announce changes
- [ ] Unit test: counter renders correct count at 0, 1, 140, 160, and 161 characters
- [ ] Unit test: submit button is disabled when count > 160

## Constraints
- Stack: Next.js App Router, Tailwind + shadcn, Prisma + SQLite/Neon
- No new npm dependencies — use existing shadcn primitives and Tailwind utilities
- Character limit validation must also exist server-side in the createTodo action
- Do not modify the Prisma schema

## Out of scope
- Configurable character limits per user
- Truncating input automatically at the limit
- Any changes to existing todos (edit mode is out of scope)
