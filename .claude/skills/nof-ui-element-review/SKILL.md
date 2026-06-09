---
name: nof-ui-element-review
description: >
  Use when writing, changing, auditing, or judging "done" on any NoF (No-Fa)
  UI — a screen, component, sheet, copy string, the pet room, the Shield
  planner / Safe Browser, or the Chrome/Edge extension. NoF is a premium Korean
  self-control / abstinence app whose users open it at their most vulnerable
  moments, where a fake button, an over-promised feature, or one shaming word
  does real harm. Use before writing UI, and whenever asked to audit a NoF
  surface or decide whether something honestly works.
---

# NoF UI Element Review

A discipline for reviewing NoF's interface the way the product asks users to
behave: slowly, honestly, one thing at a time, without pretending.

## Overview

NoF (No-Fa) is a premium Korean app for people practicing self-control (절제 /
자기통제 / NoFap). Users open it at their most vulnerable moments. A fake button,
an over-promised feature, or a single shaming word does real harm here. The core
principle of this skill is one sentence — the **prime directive** — and every
other rule is an application of it.

## The prime directive (verbatim, non-negotiable)

> Do not fake functionality. Do not claim blocking, motion, sound, dragging,
> placement, safety, iOS/Android/SNS blocking, image/video mosaic, or pet eating
> unless it actually works.

If any finding ever conflicts with the prime directive, the prime directive wins.

## When to use this skill

Invoke this review **before** you write or edit any NoF UI, and any time you are
asked to:

- add, change, or remove a screen, component, sheet, card, button, or copy string;
- audit or critique an existing NoF surface;
- touch the pet room / cat reward loop, the Shield planner or Safe Browser, or the
  Chrome/Edge extension (popup, options, blocked page);
- decide whether something is "done" or "good enough to claim as working."

If you are about to change UI and have **not** run this review for the affected
surface, stop and run it first.

## How this skill is organized

This skill is a folder-style package. Start here, then load the part you need.

| File | What it holds | Read it when |
|------|---------------|--------------|
| **[KNOWLEDGE.md](./KNOWLEDGE.md)** | Prime directive, the protected honesty rules, the honest current state of every surface, and the regression guard each rule maps to | You need to know *what is true* and *what must never be faked* |
| **[RUNBOOK.md](./RUNBOOK.md)** | The repeatable review procedure, the 22 review aspects, the finding/output format, the verification gate | You are *running a review* and need the steps |
| **[GOTCHAS.md](./GOTCHAS.md)** | Traps learned the hard way (stale docs, managed-Chrome policy, generated drift, dummy-data hygiene) | Before you trust a doc, commit a file, or test the extension |
| **[examples/README.md](./examples/README.md)** | Worked output formats: screen claim audit, protected-rule finding, PASS/CAUTION/FAIL summary | You need a template for the review you are writing |
| **[evals/honesty_fixtures.json](./evals/honesty_fixtures.json)** | Abstract anti-pattern fixtures a future check should catch (fake eating, fake blocking, fake audio, …) | You are wiring or extending the honesty checks |

## Severity scale (shared vocabulary)

Tag every finding:

- **P0** — Breaks the prime directive or a protected rule (fakes functionality,
  shames the user, resets all counters on one relapse, deletes rules unbidden,
  adds risky URLs/terms, asks the user to find risky sites, leaks data). Fix
  before ship.
- **P1** — Real UX harm or confusion (unclear primary action, missing state
  feedback, broken hierarchy, inaccessible control, cold copy) but not a directive
  violation. Fix soon.
- **P2** — Polish, consistency, minor copy, nice-to-have. Fix when convenient.

## Working ethos (always on)

- **Review before you build.** Reading is free; a shipped lie is not.
- **Trust source over docs.** Verify against the actual component and
  `scripts/nof-regression-check.mjs`. Flag stale docs; do not believe them.
- **Honesty beats polish.** If you cannot make a feature real this round, make its
  label honest (준비 중 / 배치 계획 / 잠깐 멈춤) rather than impressive.
- **No shame, ever.** When in doubt about a word, choose the warmer, plainer one.
- **Evidence before "done."** `npm run build` + `npm run check:nof` + a real look at
  `git status` / `git diff`. Claims of "working" require evidence, not intent.
