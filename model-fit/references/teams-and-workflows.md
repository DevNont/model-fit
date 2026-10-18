# Teams and workflows — more than one agent on a task

Read this when a task needs more than one agent at a time: parallel pieces, a
team of roles, or a workflow script. The one-agent rules stay in SKILL.md §5.

Three ways to run more than one agent, in rising order of cost. Climb a rung
only when the cheaper one cannot do the job.

| Rung | What it is | Use when |
|---|---|---|
| Parallel agents | 2–3 independent `Agent` calls in one message; each reports back to the main thread | independent pieces with no ordering between them (§5) |
| Agent team | a few long-lived agents with distinct roles (builder · reviewer · docs) that the main thread keeps for the whole task through SendMessage | the task runs through several rounds (build → review → fix) and each round needs the same role's earlier context |
| Workflow | a script that orchestrates agents deterministically (pipeline / parallel / phases) and runs in the background | ≥ 4 dependent stages or a fan-out over many targets — AND the user asked for it |

Rules:
- **A workflow is opt-in by the user, never by the model.** It can spend
  dozens of agents in one burst. Run one only when the user said so (a
  keyword such as `ultracode`, "use a workflow", or a skill that calls for
  it). Otherwise describe what it would do and its rough cost, and ask. A
  task that would merely benefit from one does not qualify.
- **Size the team to the rounds, not to the files.** Every round pays for
  every member's context. Two roles (builder + reviewer) cover most tasks;
  add a third only when docs or tests are a separate stream. Beyond three, a
  workflow is cheaper and more predictable.
- **Builder and reviewer are different agents — and different models when
  possible.** A reviewer that shares the builder's context or conclusions
  anchors on them. Hand the reviewer the diff and the spec, not the builder's
  report. One tier down for style and gates; one tier up, or the main
  thread, for design and risk.
- **One main thread owns the team.** Members report to the main thread, not
  to each other, and the main thread relays what matters. Peer-to-peer
  messages are for handing over a concrete artefact (a path, a failing test
  name), never for decisions — those stay with the main thread (§1).
- **Reuse before you spawn.** Before starting a team, check `ListAgents` for
  an agent or session that already holds the context: an earlier helper,
  another local session on the same repo, a cloud session. A message to it
  costs one turn; a new agent pays the whole re-read. Do not hand work to a
  session the user has not said is yours to use.
- **Budget the task, not only the concurrency.** §5's "3 concurrent" is per
  message. For a team or workflow also set an agent budget for the whole task
  up front (a medium workflow stays under 10 agents) and stop to report when
  it is reached rather than quietly spawning more.
- **Background work is not polled.** Teams and workflows run in the
  background and notify on completion. Do not spawn or wake an agent just to
  check on another; wait for the notification, and never predict its result.
- **Verification does not scale down with the team.** §6 applies to every
  member's output and to the workflow's final result. A reviewer agent's
  verdict is input to the main thread's own check, not a replacement for it.
