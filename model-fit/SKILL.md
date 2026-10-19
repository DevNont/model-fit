---
name: model-fit
description: Decide what the main thread does itself and what goes to a subagent, on which model, across the whole development cycle (plan → implement → verify → docs → commit/release) — tuned for token cost without lowering the standard of proof. Use when starting any feature, fix or refactor, when about to spawn a subagent or a parallel fan-out, when choosing a subagent model (haiku/sonnet/opus/fable), when writing a subagent brief, when forming an agent team or considering a workflow, or when a long session's context is filling up. Triggers on "delegate", "use a subagent", "which model", "save tokens", "ประหยัด token", "ใช้ agent", "ทีม agent", "agent team", "workflow", "sdlc", "adlc", "วางแผนงาน".
---

# Agent + SDLC — who does what, on which model

A fresh subagent has a fixed cost: its own system context, a brief written
from scratch, re-reading files the main thread already read, and a report the
main thread must still verify. Delegation is worth it only when the work is
large, parallel, or would flood the main context with file reads. Everything
below follows from that.

If the project has its own rules (CLAUDE.md, memory, a project skill) for
agent types, gates, branch flow or release steps, those win; this skill
supplies the split and the cost discipline. When the project defines its own
agent types (a builder for its backend, an investigator, a fan-out worker),
prefer the matching one over a general-purpose agent.

Longer material lives next to this file and is read only when its case
applies — do not load it up front:

- `references/expensive-main.md` — small work when the main thread runs on a
  top-tier model (session helper, batching, fewer main turns).
- `references/teams-and-workflows.md` — more than one agent on a task:
  parallel agents, a team of roles, workflow scripts.
- `references/sdlc.md` — the lifecycle run the agentic way (SDLC / ADLC):
  owner, human gate, agent permissions, model and token rule per phase, the
  calibrate loop after release, and how to scale the cycle.

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

Never delegate: a lookup whose target is known, a one-command check, a diff
small enough to read directly.

**When the main thread is on the top tier** (`fable`, or `opus` when usage is
tight) the inline threshold drops to one file / ~10 lines, and small work goes
to one session helper in batches — read `references/expensive-main.md`.

**Protect the main context.** Lower the inline threshold — delegate reads and
edits you would otherwise do inline — as soon as any of these has happened:
- a compaction summary has replaced earlier turns;
- you are about to re-read a file you already read in this session;
- you are scrolling back through old tool output to answer something;
- the work has run into a second day on the same session.

## 3. Model per job

| Model | Use for |
|---|---|
| `haiku` | read-only legwork with a checkable answer: locate, list usages, summarise a log |
| `sonnet` | bounded, fully specified writing: named-lines edits, CSS, copy, changelog, docs, tests to an existing pattern |
| `opus` | real implementation: multi-file features, backend work, state / concurrency / migrations / auth, anything with open design choices |
| `fable` | only a second-opinion design review, a stalled root-cause hunt, an adversarial review of a risky change — not for building |

Unsure between two tiers: one up for what ships to users, one down for
read-only. The choice is per task, not per session.

- **Agent type first, then model.** For a search or an audit pick a read-only
  type (an Explore-style agent, or the project's investigator) so it cannot
  edit anything by accident; for building pick the project's own builder when
  it has one. The table above then picks the tier inside that type.
- **`fork`** always runs on the parent model and inherits the whole
  conversation, so it is not a way to pick a cheaper model. Use it only when
  the brief would otherwise have to restate much of this session (a review of
  decisions made here, continuing a half-done analysis) — and never late in a
  long session, because the fork pays for the entire context again.
- **`effort` is not yours to set.** Leave an agent's reasoning effort at its
  default unless the user or a project rule explicitly asks for a level; the
  model choice is the lever this skill uses.

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

Template (fill every line; delete none — a smaller model follows the shape
better than the prose above):

```
Goal: <one sentence; what "done" looks like>
Ruled out: <what is already known not to be the cause / not to be done>
Read: <exact paths, in the order to read them>
Touch: <exact paths the agent may change — nothing else>
Mirror: <the one existing file whose pattern to copy>
Rules: <conventions that bind, and the project file that states them>
Gates: <commands that must pass before reporting>
Report (≤ 25 lines): paths changed, one line each · gate results · open questions. No diffs, no file dumps.
```

## 5. Run

- Independent pieces go out in one message; at most 3 concurrent agents
  unless a fan-out genuinely needs one per target.
- No two agents on overlapping files; no agent "just in case". Two builders
  that must work on the same repo at once each get their own worktree
  (`isolation: worktree`) so they cannot write over each other; a worktree
  that ends with no change cleans itself up. A read-only agent needs none.
- A follow-up goes to the SAME agent (SendMessage) — a fresh one pays the
  whole read again.
- **One retry, then escalate.** When a report comes back wrong or incomplete,
  send ONE correction to the same agent naming the exact gap. If the second
  result is still wrong, stop: do it inline, or restart with a model one tier
  up and a brief that names the failure. Never a third round on the same agent.
- Once delegated, do not also do or read that piece. Wait for the report, and
  never predict or invent it.
- More than one agent on a task — parallel pieces, a team of roles, a
  workflow — follows `references/teams-and-workflows.md`. A workflow is
  opt-in by the user, never by the model.

## 6. Verify — same standard, cheaper path

- Every subagent result is checked first-hand before it is reported as done:
  `git diff --stat`, the diff of the risky hunks, the gates, and one real
  check of the behaviour. Not a re-read of every file it touched.
- Run gates once at the end, not per edit; read failures only.
- Send large output (logs, test runs, sweeps) through a sandbox/processing
  tool so only the derived answer enters the conversation.
- Verification is never skipped to save tokens. If something could not be
  checked, say it was not checked.

## 7. SDLC / ADLC — owner and gate per phase

Planning, verification and commit · push · release stay on the main thread;
implementation and docs go out per §2 and §3 (one agent for a whole doc set,
never one per file). Every phase ends at a human-owned gate — an agent never
passes its own phase — and the loop runs one phase past release: calibrate,
from the `delegated:` lines of §8. Scale the cycle to the change — a hotfix
is inline with no plan file, a cross-layer feature is plan → parallel
builders → one doc pass → main-thread verification. The table per phase
(owner, gate, permissions, model) and the three cycle sizes are in
`references/sdlc.md`.

## 8. Report to the user

One line saying what was done inline and which model did each delegated
piece. State plainly anything not verified.

Then, for every piece that was delegated, append one line to the project's
work log (or its prompt log, if that is what the project keeps):

```
delegated: <job> · <agent type>/<model> · <n> rounds · redo: yes/no · <why, if yes>
```

These lines are the only data the Tuning section has. If the project keeps no
such log, put the line in the report instead.

## Tuning

The thresholds (2 files, ~40 lines, ~10 lines on a top-tier main model,
~25-line report, 3 concurrent agents, 1 retry, a 2–3 role team, ~10 agents
per task) are starting points, not measurements. Before changing one, read
the `delegated:` lines of the last few sessions: tighten when `redo: yes`
repeats for one model or one kind of job; loosen when the main context kept
filling while agents sat idle.
