#!/bin/sh
# model-fit gate — Claude Code hook for SessionStart and UserPromptSubmit.
# Registered by `node hooks/install.js` (see README). Prints the standing rule
# so every prompt in every project is handled through the model-fit skill.
# Never blocks: always exits 0.
cat <<'TXT'
MODEL-FIT GATE (every project, every session, every prompt):
1. If the `model-fit` skill has not been loaded in this session yet, or the session was just compacted or resumed, load it now with the Skill tool (`model-fit`) before any other tool call or reply. Project rules (CLAUDE.md, memory, project skills) still win on agent types, gates, branch flow and release steps.
2. Decide this prompt through model-fit: inline or delegate, which agent type, which model, how it is verified, what the report says.
3. The first line of the reply states that model-fit is in use and the split chosen, in the user's language: `model-fit: inline (<main model>)`, `model-fit: agent <type>/<model> ×<n> + inline verify`, or `model-fit: inline, no agent` for a question-only prompt.
4. Work that touched code ends with the "Who did what" block from model-fit §8.
TXT
exit 0
