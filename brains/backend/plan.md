# Plan

## Assumptions

- Claude Code hooks are configured in `.claude/settings.json` under `hooks`.
- The `PreToolUse` and `PostToolUse` hook events fire for every tool call; we filter on `tool_name == "Skill"`.
- Hook scripts receive a JSON payload via stdin with `session_id`, `tool_name`, `tool_input`, and (for PostToolUse) `tool_response`.
- **Node.js** is the hook script runtime — not Python. Claude Code is a TypeScript/Node.js app, so Node.js is a guaranteed dependency on every machine running Claude Code. Python is not. Scripts are plain `.js` (no compilation step needed).
- Log storage follows the `understand-anything` convention: `~/.claude/plugin/cache/cctracking/<prj>/<session_id>.jsonl`. One JSONL file per session, grouped by project. `<prj>` is derived from the basename of the current working directory at hook execution time.
- The pre→post timing temp file uses the same cache dir: `~/.claude/plugin/cache/cctracking/<prj>/<session_id>.pre.json`, deleted after PostToolUse writes the log entry.

## Architecture

```
Claude Code
   │
   ├─ PreToolUse (Skill) ──► pre_skill.js ──► writes timing snapshot to
   │                                           ~/.claude/plugin/cache/cctracking/<prj>/<sid>.pre.json
   │
   └─ PostToolUse (Skill) ─► post_skill.js ─► reads .pre.json, computes duration,
                                               appends skill_invocation entry to
                                               ~/.claude/plugin/cache/cctracking/<prj>/<sid>.jsonl
                                               deletes .pre.json
```

## Log Entry Schema

**Skill invocation entry** (written by `post_skill.js`):
```json
{
  "type": "skill_invocation",
  "session_id": "abc123",
  "skill": "simplify",
  "triggered_by": "simplify the auth module",
  "started_at": "2026-05-18T10:00:00Z",
  "duration_seconds": 4.2
}
```

## File Layout

```
cctracking/
├── hooks/
│   ├── pre_skill.js       # PreToolUse handler
│   └── post_skill.js      # PostToolUse handler
└── .claude/
    └── settings.json      # Hook registrations

~/.claude/plugin/cache/cctracking/
└── <prj>/
    ├── <session_id>.jsonl      # log entries for that session
    └── <session_id>.pre.json   # ephemeral pre-hook timing (deleted after PostToolUse)
```

## Steps

1. **Write `hooks/pre_skill.js`**
   - Read JSON from stdin; exit 0 immediately if `tool_name != "Skill"`.
   - Derive `<prj>` from `path.basename(process.cwd())`.
   - `mkdir -p ~/.claude/plugin/cache/cctracking/<prj>/`.
   - Write `{session_id, skill, args, triggered_by, start_time}` to `<prj>/<session_id>.pre.json`.
   - verify: pipe sample PreToolUse payload to script, confirm `.pre.json` is created with correct fields.

2. **Write `hooks/post_skill.js`**
   - Read JSON from stdin; exit 0 immediately if `tool_name != "Skill"`.
   - Read `.pre.json`; compute `duration_seconds = (Date.now() - start_time) / 1000`.
   - Append `skill_invocation` JSONL entry to `<session_id>.jsonl`.
   - Delete `.pre.json`.
   - verify: pipe sample PostToolUse payload after step 1, confirm log entry appended and `.pre.json` deleted.

3. **Configure `.claude/settings.json`**
   - Register both hooks under `PreToolUse` and `PostToolUse` events using absolute paths to the hook scripts.
   - verify: `cat .claude/settings.json` shows correct config.

4. **Smoke test end-to-end**
   - Invoke a real skill inside Claude Code.
   - Confirm `~/.claude/plugin/cache/cctracking/<prj>/<sid>.jsonl` exists with a `skill_invocation` entry (correct skill name, session_id, duration > 0).
   - verify: `jq . ~/.claude/plugin/cache/cctracking/<prj>/<sid>.jsonl` parses without errors.
