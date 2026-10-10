---
name: model-fit
description: Decide what the main thread does itself and what goes to a subagent, on which model, across the whole development cycle (plan → implement → verify → docs → commit/release) — tuned for token cost without lowering the standard of proof. Use when starting any feature, fix or refactor, when about to spawn a subagent or a parallel fan-out, when choosing a subagent model (haiku/sonnet/opus/fable), when writing a subagent brief, or when a long session's context is filling up. Triggers on "delegate", "use a subagent", "which model", "save tokens", "ประหยัด token", "ใช้ agent", "sdlc", "วางแผนงาน".
---

# Agent + SDLC — who does what, on which model

A fresh subagent has a fixed cost: its own system context, a brief written
from scratch, re-reading files the main thread already read, and a report the
main thread must still verify. Delegation is worth it only when the work is
large, parallel, or would flood the main context with file reads. Everything
below follows from that.

If the project has its own rules (CLAUDE.md, memory, a project skill) for
agent types, gates, branch flow or release steps, those win; this skill
supplies the split and the cost discipline.

## 1. Roles

- **Main thread:** understands the request, plans, makes every design
  decision, reviews, runs the gates, does all git / release / browser
  verification, talks to the user.
- **Never delegated:** decisions, verification, commits, pushes, releases,
  anything on production.
- **Subagents:** searches across many files; building work that is large,
  parallel or self-contained.
- The main thread's model is the user's setting. If a rule assumes a model the
  session is not on, say so once and carry on.

## 2. Delegate or inline

Do it inline when ALL hold:
- the files are already read in this conversation, or the target is exact;
- about ≤ 2 files and ≤ ~40 changed lines;
- no design choice is left open.

Also inline: a mechanical, identical change across many files or sibling
repos (a text/version swap). One scripted loop plus a verification grep beats
one agent per target.

Delegate when ANY hold:
- ≥ 3 files, or a feature with its own tests and docs;
- two or more independent pieces that can run in parallel (backend + frontend);
- answering needs reading many files not yet read (exploration, audits, log digs);
- a repeated change that needs per-target judgment;
- work in a layer with heavy conventions (e.g. a backend with its own
  architecture rules) beyond a few lines.

Protect the main context: when the session is long or the context is filling,
lower the inline threshold — delegate reads and edits you would otherwise do
inline.

Never delegate: a lookup whose target is known, a one-command check, a diff
small enough to read directly.

### Small work when the main model is expensive

Applies when the main thread runs on the top tier (`fable`, or `opus` when
usage is tight). The cost of small inline work is not its few lines — it is
every extra main-thread turn, each of which re-reads the whole context on the
expensive model. So spend fewer main turns, and move small work to a place
with a small context.

- **Fewer main-thread turns.** Put independent tool calls in one turn, make
  several edits per turn, script a repeated edit instead of editing file by
  file, do not re-read a file you just wrote, do not narrate between calls.
- **Inline only the trivial.** One file, about 10 lines, already read. The
  ≤ 2 files / ~40 lines threshold above is for a mid-tier main model.
- **One session helper.** At the first small job, spawn ONE `sonnet` agent as
  a helper and brief it once with the repo conventions and the gates. Send
  every later small job to that same helper with SendMessage — the spawn cost
  is paid once. The helper edits; it does not decide design, commit or push.
  Start a fresh helper when the work moves to an unrelated part of the code,
  or when its reports start missing things.
- **Batch small jobs.** Collect small edits that do not block each other and
  send them as one numbered list; ask for one report. Do not hold back a job
  the user is waiting on, and flush the batch before verifying.
- **Tell the user about mechanical stretches.** When the next stretch is
  mechanical (repeated edits, copy changes, version bumps), say once that a
  cheaper session model would do (`/model sonnet`) and that planning and
  review should go back to the stronger one. Only the user can switch; never
  assume they did.

On a mid-tier main model, skip this section and use the thresholds above.

## 3. Model per job

| Model | Use for |
|---|---|
| `haiku` | read-only legwork with a checkable answer: locate, list usages, summarise a log |
| `sonnet` | bounded, fully specified writing: named-lines edits, CSS, copy, changelog, docs, tests to an existing pattern |
| `opus` | real implementation: multi-file features, backend work, state / concurrency / migrations / auth, anything with open design choices |
| `fable` | only a second-opinion design review, a stalled root-cause hunt, an adversarial review of a risky change — not for building |

Unsure between two tiers: one up for what ships to users, one down for
read-only. The choice is per task, not per session. A `fork` always runs on
the parent model, so it is not a way to pick a cheaper one.

### When some models are not available

Plans and API setups differ in which models and how much usage they allow.
Check what the session can actually use (`/model` lists it) and map the table
down instead of failing:

- No `fable` → use the strongest model available for the second-opinion
  cases, or skip the second opinion and review more carefully on the main
  thread.
- No or scarce `opus` → `sonnet` builds, with a more explicit brief (name the
  pattern file, the exact functions, the edge cases) and a smaller scope per
  agent; keep the design decisions on the main thread.
- Only one model → the model column no longer matters; the rest of this skill
  still does. Delegation then saves context, not model cost, so delegate only
  for parallel work and for reads that would flood the main context.
- Tight usage limits or pay-per-token → raise the inline threshold (fewer
  agents), cap concurrency at 1–2, prefer `haiku` for every search, and never
  fan out the same check to several agents.

If a `model` override is rejected, do not retry it — drop to the next tier
and say which model actually did the work.

## 4. Brief and report

Brief — complete in its instructions, light in its content:
- goal, and what is already ruled out;
- exact paths to read and to touch;
- the existing file to mirror, so the agent does not explore again;
- the conventions that bind, the gates to run, the definition of done.

Point at files and docs; never paste their contents or the conversation. A
smaller model gets a more explicit brief, not a shorter one. For an
independent review, hand over the code, not your conclusion.

Always ask for a capped report: paths changed with one line each, gate
results, open questions — ≤ ~25 lines, no diff paste, no file dumps.

## 5. Run

- Independent pieces go out in one message; at most 3 concurrent agents
  unless a fan-out genuinely needs one per target.
- No two agents on overlapping files; no agent "just in case".
- A follow-up goes to the SAME agent (SendMessage) — a fresh one pays the
  whole read again.
- Once delegated, do not also do or read that piece. Wait for the report, and
  never predict or invent it.

## 6. Verify — same standard, cheaper path

- Every subagent result is checked first-hand before it is reported as done:
  `git diff --stat`, the diff of the risky hunks, the gates, and one real
  check of the behaviour. Not a re-read of every file it touched.
- Run gates once at the end, not per edit; read failures only.
- Send large output (logs, test runs, sweeps) through a sandbox/processing
  tool so only the derived answer enters the conversation.
- Verification is never skipped to save tokens. If something could not be
  checked, say it was not checked.

## 7. SDLC — owner per phase

| Phase | Owner | Model | Token rule |
|---|---|---|---|
| 1 Understand & plan | main; a search agent only if the pattern to mirror is unknown | haiku for the search | find ONE existing pattern to mirror, then stop searching |
| 2 Implement | per §2: inline, or builders in parallel | opus / sonnet per §3 | the brief names the pattern file |
| 3 Verify | main | — | §6 |
| 4 Docs | inline if it is a line or a paragraph; else ONE agent for the whole doc set | sonnet | not one agent per file |
| 5 Commit · push · release | main, never delegated | — | git and deploy state must be first-hand |

Scale the cycle to the change:
- **Hotfix / one-line fix:** 2 → 3 → 5 inline. No agent, no plan file.
- **Small feature (one repo, few files):** a few-line plan, inline or one
  sonnet agent, verify, commit.
- **Cross-layer feature:** plan first, parallel opus builders, one sonnet doc
  pass, main-thread verification, user-facing announcement if the project
  has one.

## 8. Report to the user

One line saying what was done inline and which model did each delegated
piece. State plainly anything not verified.

## Tuning

The thresholds (2 files, ~40 lines, ~10 lines on a top-tier main model,
~25-line report, 3 agents) are starting
points, not measurements. Tighten them when subagents keep returning work
that needed redoing; loosen them when the main context keeps filling.
