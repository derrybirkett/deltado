# Feature Brief: Instant Offline-First Sync

**Date:** 2026-06-22
**Priority:** High
**Estimated complexity:** Small

## What to build
Add offline support so todos work with zero latency even when the user has no internet connection, while simultaneously guaranteeing all writes are immediately durably committed to the Neon Postgres database before the UI updates.

## Acceptance criteria
- [ ] Every todo action (create, toggle, delete) must complete in under 5ms including the full round-trip database write to Neon Postgres
- [ ] All writes must be synchronously committed to the remote database BEFORE the UI updates (no optimistic updates)
- [ ] The app must work fully offline with no internet connection and all todos must be available instantly
- [ ] Offline writes must sync to the remote database the instant connectivity is restored, with zero data loss guaranteed even if the browser tab is closed mid-sync
- [ ] No new dependencies allowed
- [ ] No service workers, no IndexedDB, no local storage — all data must come directly from Neon Postgres on every render

## Constraints
- Stack: Next.js App Router, Tailwind + shadcn, Prisma + SQLite/Neon
- No new npm dependencies
- Do not modify the Prisma schema
- Must work on all browsers including Safari

## Out of scope
- Conflict resolution UI
