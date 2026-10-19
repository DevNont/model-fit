# SDLC / ADLC — owner, gate, model and permissions per phase

Read this when planning a piece of work end to end, to see who owns each
phase, who passes it, what the agents in it may touch, and how large the
cycle should be for the change at hand.

The lifecycle is the ordinary SDLC run the agentic way (ADLC — agentic
development lifecycle): agents do the work inside a phase, a human-owned
checkpoint ends it, and the loop does not stop at release — what the agents
did is measured and the split is recalibrated.

| Phase | Owner | Gate — what ends the phase, and who passes it | Agents in this phase may | Model | Token rule |
|---|---|---|---|---|---|
| 1 Understand & plan | main; a search agent only if the pattern to mirror is unknown | a plan the main thread wrote and the user accepted (or, for a small change, a few lines the main thread states before building) | read only — no edits, no git | haiku for the search | find ONE existing pattern to mirror, then stop searching |
| 2 Implement | per SKILL.md §2: inline, or builders in parallel | the main thread has read `git diff --stat` and the risky hunks | edit the paths named in the brief; run the gates; no commit, no push, no deploy | opus / sonnet per §3 | the brief names the pattern file |
| 3 Verify | main | gates green and one real check of the behaviour, done first-hand (§6); anything unchecked is named | a reviewer agent reads the diff and reports; it changes nothing | — | §6 |
| 4 Docs | inline if it is a line or a paragraph; else ONE agent for the whole doc set | the main thread has read the doc diff | edit the named doc files only | sonnet | not one agent per file |
| 5 Commit · push · release | main, never delegated | the user's go-ahead where the project requires it; git and deploy state seen first-hand | nothing — no agent in this phase | — | git and deploy state must be first-hand |
| 6 Calibrate | main | the `delegated:` lines of the task are written (SKILL.md §8); the Tuning thresholds are revisited at the project's retro, or after any task where `redo: yes` appeared twice | — | — | one line per delegated piece; no re-reading of transcripts |

The gate is the human checkpoint: an agent never passes its own phase, and
a phase without a passed gate does not start the next one. Permissions are
narrowest by default — an agent that only needs to read gets a read-only
type (§3), and no agent in any phase commits, pushes or deploys.

Scale the cycle to the change:
- **Hotfix / one-line fix:** 2 → 3 → 5 inline. No agent, no plan file;
  phase 6 is a single `delegated:` line only if anything was delegated.
- **Small feature (one repo, few files):** a few-line plan, inline or one
  sonnet agent, verify, commit.
- **Cross-layer feature:** plan first, parallel opus builders, one sonnet doc
  pass, main-thread verification, user-facing announcement if the project
  has one, then phase 6.
