#!/usr/bin/env node
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const DEST_HOOKS = path.join(os.homedir(), '.claude', 'plugins', 'braintracker', 'hooks');
const SETTINGS   = path.join(os.homedir(), '.claude', 'settings.json');

const PRE_CMD         = `node ${path.join(DEST_HOOKS, 'pre_skill.js')}`;
const POST_CMD        = `node ${path.join(DEST_HOOKS, 'post_skill.js')}`;
const PRE_PROMPT_CMD  = `node ${path.join(DEST_HOOKS, 'pre_prompt.js')}`;
const POST_PROMPT_CMD = `node ${path.join(DEST_HOOKS, 'post_prompt.js')}`;
const PRE_TURN_CMD    = `node ${path.join(DEST_HOOKS, 'pre_turn.js')}`;
const POST_TURN_CMD   = `node ${path.join(DEST_HOOKS, 'post_turn.js')}`;

function readSettings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS, 'utf8')); } catch { return {}; }
}

function writeSettings(settings) {
  fs.mkdirSync(path.dirname(SETTINGS), { recursive: true });
  fs.writeFileSync(SETTINGS, JSON.stringify(settings, null, 2) + '\n');
}

function addHook(arr, matcher, command) {
  let group = matcher != null
    ? arr.find(h => h.matcher === matcher)
    : arr.find(h => h.matcher == null);
  if (!group) {
    group = matcher != null ? { matcher, hooks: [] } : { hooks: [] };
    arr.push(group);
  }
  group.hooks = group.hooks || [];
  if (!group.hooks.some(h => h.command === command)) {
    group.hooks.push({ type: 'command', command });
  }
}

function removeHook(arr, command) {
  if (!arr) return arr;
  return arr
    .map(group => ({ ...group, hooks: (group.hooks || []).filter(h => h.command !== command) }))
    .filter(group => group.hooks.length > 0);
}

function install() {
  const SRC_HOOKS = path.join(__dirname, '..', 'braintracker', 'hooks');
  fs.mkdirSync(DEST_HOOKS, { recursive: true });
  for (const file of ['pre_skill.js', 'post_skill.js', 'pre_prompt.js', 'post_prompt.js', 'pre_turn.js', 'post_turn.js']) {
    fs.copyFileSync(path.join(SRC_HOOKS, file), path.join(DEST_HOOKS, file));
  }

  const settings = readSettings();
  settings.hooks                    = settings.hooks                    || {};
  settings.hooks.PreToolUse         = settings.hooks.PreToolUse         || [];
  settings.hooks.PostToolUse        = settings.hooks.PostToolUse        || [];
  settings.hooks.UserPromptSubmit   = settings.hooks.UserPromptSubmit   || [];
  settings.hooks.Stop               = settings.hooks.Stop               || [];
  addHook(settings.hooks.PreToolUse,       'Skill', PRE_CMD);
  addHook(settings.hooks.PostToolUse,      'Skill', POST_CMD);
  addHook(settings.hooks.UserPromptSubmit, null,    PRE_PROMPT_CMD);
  addHook(settings.hooks.UserPromptSubmit, null,    PRE_TURN_CMD);
  addHook(settings.hooks.Stop,             null,    POST_PROMPT_CMD);
  addHook(settings.hooks.Stop,             null,    POST_TURN_CMD);
  writeSettings(settings);

  console.log('braintracker installed.');
  console.log('Logs → ~/.claude/plugin/cache/braintracker/<project>/<session>.jsonl');
}

function uninstall() {
  fs.rmSync(path.join(os.homedir(), '.claude', 'plugins', 'braintracker'), { recursive: true, force: true });

  const settings = readSettings();
  if (settings.hooks) {
    settings.hooks.PreToolUse       = removeHook(settings.hooks.PreToolUse,       PRE_CMD);
    settings.hooks.PostToolUse      = removeHook(settings.hooks.PostToolUse,      POST_CMD);
    settings.hooks.UserPromptSubmit = removeHook(settings.hooks.UserPromptSubmit, PRE_PROMPT_CMD);
    settings.hooks.UserPromptSubmit = removeHook(settings.hooks.UserPromptSubmit, PRE_TURN_CMD);
    settings.hooks.Stop             = removeHook(settings.hooks.Stop,             POST_PROMPT_CMD);
    settings.hooks.Stop             = removeHook(settings.hooks.Stop,             POST_TURN_CMD);
  }
  writeSettings(settings);

  console.log('braintracker uninstalled.');
}

function disable() {
  const settings = readSettings();
  if (settings.hooks) {
    settings.hooks.PreToolUse       = removeHook(settings.hooks.PreToolUse,       PRE_CMD);
    settings.hooks.PostToolUse      = removeHook(settings.hooks.PostToolUse,      POST_CMD);
    settings.hooks.UserPromptSubmit = removeHook(settings.hooks.UserPromptSubmit, PRE_PROMPT_CMD);
    settings.hooks.UserPromptSubmit = removeHook(settings.hooks.UserPromptSubmit, PRE_TURN_CMD);
    settings.hooks.Stop             = removeHook(settings.hooks.Stop,             POST_PROMPT_CMD);
    settings.hooks.Stop             = removeHook(settings.hooks.Stop,             POST_TURN_CMD);
  }
  writeSettings(settings);
  console.log('braintracker disabled. Hook files kept. Run "npx braintracker enable" to re-enable.');
}

function enable() {
  if (!fs.existsSync(path.join(DEST_HOOKS, 'pre_skill.js'))) {
    console.error('braintracker is not installed. Run "npx braintracker" to install first.');
    process.exit(1);
  }

  const settings = readSettings();
  settings.hooks                    = settings.hooks                    || {};
  settings.hooks.PreToolUse         = settings.hooks.PreToolUse         || [];
  settings.hooks.PostToolUse        = settings.hooks.PostToolUse        || [];
  settings.hooks.UserPromptSubmit   = settings.hooks.UserPromptSubmit   || [];
  settings.hooks.Stop               = settings.hooks.Stop               || [];
  addHook(settings.hooks.PreToolUse,       'Skill', PRE_CMD);
  addHook(settings.hooks.PostToolUse,      'Skill', POST_CMD);
  addHook(settings.hooks.UserPromptSubmit, null,    PRE_PROMPT_CMD);
  addHook(settings.hooks.UserPromptSubmit, null,    PRE_TURN_CMD);
  addHook(settings.hooks.Stop,             null,    POST_PROMPT_CMD);
  addHook(settings.hooks.Stop,             null,    POST_TURN_CMD);
  writeSettings(settings);

  console.log('braintracker enabled.');
}

const cmd = process.argv[2];
if      (cmd === 'uninstall') uninstall();
else if (cmd === 'disable')   disable();
else if (cmd === 'enable')    enable();
else                          install();
