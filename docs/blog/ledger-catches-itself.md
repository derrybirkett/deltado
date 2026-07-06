---
title: "The Audit Agent Doesn't Get Bored"
slug: "ledger-catches-itself"
date: "2026-07-06"
theme: "AI agents"
summary: "I built an agent whose only job is to catch when my autonomous pipeline breaks. It worked perfectly for two weeks straight. The thing it caught was me."
---

I built an agent whose only job is to notice when my other agents stop doing theirs. It's called Ledger. It ran every day for two weeks and filed the same complaint fifteen times. It was right all fifteen times. The bug wasn't in the pipeline — it was that I never told it the test was over.

## The pipeline

deltado is a todo app I use as a test-bed for autonomous software delivery. Four agents run the whole loop with no human in it:

- **Delta** picks a feature nightly at 02:00 UTC, writes a brief, builds it test-first, opens a PR.
- **Council** reviews every Delta PR automatically — a CTO advisor that approves, requests revisions, or rejects.
- **Merge** polls every 30 minutes, waits 24 hours after a PR is marked ready, runs one more AI safety check, then squash-merges or blocks.
- **Ledger** runs daily at 08:00 UTC, checks five deterministic rules against every open PR, and opens a `ledger/gap` issue the moment something has drifted — a PR sitting unreviewed too long, a merge that should have happened and didn't.

Delta builds, Council reviews, Merge ships, Ledger audits. None of them ask me anything.

## Testing agents you don't watch

You can't unit-test "does this agent behave correctly under autonomy" — the whole point is nobody's watching in real time. So I built fixture PRs that simulate the scenarios each agent needs to get right: a clean implementation, an out-of-scope one, a secret committed by accident, an auth check silently removed. Five for Council, six for Ledger, seven for Merge. Then I fired the real workflows against them and read what came back.

Two days in, the `ANTHROPIC_API_KEY` GitHub Actions secret hit its usage cap. Council review and the Ledger checks both need it. I left the fixtures staged and moved on to other work, planning to come back when quota reset on July 1st.

## What was actually happening while I wasn't looking

By the time I picked this back up, the evidence had piled up on its own. Merge had merged the clean-change fixture and correctly blocked the three that removed auth, exposed a secret, or duplicated an already-blocked PR. Council had approved the one clean fixture and flagged the other four for revision — out-of-scope work, an unsanitized input, a Prisma call in a component, all caught. Real production PRs — a keyboard shortcut overlay, inline todo editing — had shipped through the same pipeline without me touching them.

And then there was PR #14.

It's the Ledger fixture built specifically to test "Council review overdue." Ledger's job is to flag a PR that's sat with the `delta` label for too long without a review label attached. PR #14 has sat exactly like that since June 22nd. So every single morning at 08:00 UTC, Ledger opened a new issue: *PR #14 has been open for N hours with no Council review. Compare with PRs #15 through #19, all reviewed within hours — #14 is the clear outlier.*

Fifteen issues. Same PR. Same finding, worded slightly differently each time, because Ledger has no memory of yesterday's issue and no way to know this PR was manufactured to trip its own rule. It just checks the state of the world and reports what it finds. Every single report was correct.

## The agent isn't supposed to know it's a test

This is the part that's easy to miss when you're building the harness: the value of an audit agent is exactly that it doesn't grade on effort, doesn't remember you meant to clean up, and doesn't get quieter the tenth time it says the same thing. Ledger enforcing its rule against a fixture I forgot to close is the same behaviour as Ledger enforcing it against a real PR I forgot to review. There's no branch in its logic for "this one's mine, go easy."

That's what makes it usable in production and what makes it exhausting in a test harness. I don't get to tell it "not now" — I have to close the PR.

Fifteen identical issues later, the lesson isn't about Ledger's code. It's that an agent that never assumes good faith on your behalf is the only kind worth deploying — and the only kind that will actually notice once you've stopped paying attention.
