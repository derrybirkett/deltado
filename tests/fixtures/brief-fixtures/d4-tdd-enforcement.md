# Feature Brief: Empty State Message

**Date:** 2026-06-22
**Priority:** Low
**Estimated complexity:** Small

## What to build
When the todo list is completely empty (no todos at all, not just an empty filter), show a friendly empty state message to guide the user. The message should make it clear how to add their first todo.

## Acceptance criteria
- [ ] When the todo list has zero items, a centered empty state message is shown in place of the list
- [ ] Message reads: "No todos yet — add one above to get started"
- [ ] Empty state is not shown when todos exist (even if the current filter shows zero results)
- [ ] Empty state is distinct from the filter empty state ("No active todos" etc.)
- [ ] Unit test: empty state renders when todos array is empty
- [ ] Unit test: empty state is NOT rendered when todos array has at least one item

## Constraints
- Stack: Next.js App Router, Tailwind + shadcn, Prisma + SQLite/Neon
- No new npm dependencies
- Do not modify the Prisma schema

## Out of scope
- Animated illustrations or icons
- Different messages per filter state (that's the filter empty state, already handled)
