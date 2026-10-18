# SDLC — owner, model and token rule per phase

Read this when planning a piece of work end to end, to see who owns each
phase and how large the cycle should be for the change at hand.

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
