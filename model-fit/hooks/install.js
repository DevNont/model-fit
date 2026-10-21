#!/usr/bin/env node
// Registers the model-fit gate hook with Claude Code and adds the standing
// rule to CLAUDE.md. Idempotent: run it again after `npx skills update`.
//
//   node <skill dir>/hooks/install.js            global: ~/.claude/settings.json + ~/.claude/CLAUDE.md
//   node <skill dir>/hooks/install.js --project  this repo: .claude/settings.json + CLAUDE.md
//   node <skill dir>/hooks/install.js --remove   take the hook and the rule out again (add --project for the repo)
//
// Needs only node, which Claude Code already requires. macOS, Linux and WSL;
// on Windows run it from Git Bash so the hook's `sh` is available.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const args = new Set(process.argv.slice(2));
const project = args.has('--project');
const remove = args.has('--remove');

const hookFile = fs.realpathSync(path.join(__dirname, 'model-fit-gate.sh'));
const root = project ? process.cwd() : os.homedir();
const settingsPath = path.join(root, '.claude', 'settings.json');
const claudeMdPath = project ? path.join(root, 'CLAUDE.md') : path.join(root, '.claude', 'CLAUDE.md');

// Project installs reference the repo-relative path so every clone works.
const command = project
  ? '"${CLAUDE_PROJECT_DIR}/' + path.relative(root, hookFile).split(path.sep).join('/') + '"'
  : '"' + hookFile.replace(os.homedir(), '$HOME') + '"';

const MARK = 'model-fit-gate';
const EVENTS = ['SessionStart', 'UserPromptSubmit'];

function loadSettings() {
  if (!fs.existsSync(settingsPath)) return {};
  const text = fs.readFileSync(settingsPath, 'utf8');
  try { return JSON.parse(text); } catch (e) {
    console.error(`cannot parse ${settingsPath}: ${e.message}`); process.exit(1);
  }
}

function stripOurs(list) {
  return (list || []).filter((entry) => !JSON.stringify(entry).includes(MARK));
}

const settings = loadSettings();
settings.hooks = settings.hooks || {};
for (const ev of EVENTS) {
  const kept = stripOurs(settings.hooks[ev]);
  if (!remove) kept.unshift({ hooks: [{ type: 'command', command, timeout: 5 }] });
  if (kept.length) settings.hooks[ev] = kept; else delete settings.hooks[ev];
}
if (!Object.keys(settings.hooks).length) delete settings.hooks;
fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
if (fs.existsSync(settingsPath)) fs.copyFileSync(settingsPath, settingsPath + '.bak-model-fit');
fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
fs.chmodSync(hookFile, 0o755);

const BEGIN = '<!-- model-fit:begin -->';
const END = '<!-- model-fit:end -->';
const rule = [
  BEGIN,
  '## model-fit (always on)',
  '',
  '- Every prompt in this ' + (project ? 'repo' : 'machine\'s projects') + ' goes through the `model-fit` skill: load it with the Skill tool first thing in a session and again after a compaction or resume, before other tool calls. Questions, git work, docs and checks included, not only features, fixes and refactors.',
  '- The first line of every reply says that model-fit is in use and which split was chosen, e.g. `model-fit: inline (opus)` or `model-fit: agent Explore/haiku ×2 + inline verify`; `model-fit: inline, no agent` for a pure question. Work that touched code ends with the "Who did what" block from the skill.',
  '- The hook `' + command.replace(/"/g, '') + '` (SessionStart + UserPromptSubmit) restates this on every prompt; if its text is missing, the rule still applies.',
  '- Project rules on agent types, gates, branch flow and release steps win over model-fit; the skill supplies the split and the token discipline.',
  END,
].join('\n');

let md = fs.existsSync(claudeMdPath) ? fs.readFileSync(claudeMdPath, 'utf8') : '';
const re = new RegExp(BEGIN.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&') + '[\\s\\S]*?' + END.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&') + '\\n?');
md = md.replace(re, '');
if (!remove) md = (md.trimEnd() + '\n\n' + rule + '\n').replace(/^\n+/, '');
fs.mkdirSync(path.dirname(claudeMdPath), { recursive: true });
fs.writeFileSync(claudeMdPath, md);

console.log((remove ? 'removed' : 'installed') + ' model-fit gate');
console.log('  hook     ' + hookFile);
console.log('  settings ' + settingsPath + '  (' + EVENTS.join(', ') + ')');
console.log('  rule     ' + claudeMdPath);
if (!remove) console.log('restart Claude Code (or start a new session) for the hook to fire');
