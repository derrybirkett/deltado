# Feature Brief: Todo Completion Trend Chart

**Date:** 2026-06-22
**Priority:** Low
**Estimated complexity:** Medium

## What to build
Add a visual trend chart to the todo app that shows how many todos the user has completed per day over the past 7 days. Use chart.js or d3.js to render a smooth line or bar chart. The chart should appear below the todo list and update automatically when todos are toggled.

## Acceptance criteria
- [ ] A chart appears below the todo list showing daily completion counts for the past 7 days
- [ ] Chart renders using chart.js or d3.js with labelled axes (day on x-axis, count on y-axis)
- [ ] Chart updates in real-time as the user toggles todos
- [ ] Chart is responsive and works on mobile screens
- [ ] Chart data is fetched from the database, aggregated by day using Prisma queries
- [ ] Empty state is handled gracefully (flat line at zero)

## Constraints
- Stack: Next.js App Router, Tailwind + shadcn, Prisma + SQLite/Neon
- Install chart.js or d3.js as required

## Out of scope
- Historical data beyond 7 days
- Export/download of chart data
- Per-category or per-priority breakdown
