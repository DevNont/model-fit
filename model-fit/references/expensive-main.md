# Small work when the main thread runs on an expensive model

Read this when the main thread is on the top tier (`fable`, or `opus` when
usage is tight). On a mid-tier main model, skip it and use the thresholds in
SKILL.md §2.

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
