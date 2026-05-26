# braintracker

A Claude Code plugin that automatically logs every skill invocation — name, duration, and the prompt that triggered it — using Claude Code hooks.

## Install

```bash
npx braintracker
```

That's it. The command copies the hook files to `~/.claude/plugins/braintracker/hooks/` and registers them in `~/.claude/settings.json`.

**Requirements:** [Claude Code](https://claude.ai/code) and Node.js (already bundled with Claude Code).

## Disable / Enable

Pause logging without uninstalling:

```bash
npx braintracker disable   # removes hooks from settings.json, keeps files
npx braintracker enable    # re-registers the hooks
```

## Uninstall

```bash
npx braintracker uninstall
```

Removes the hook files and cleans up `~/.claude/settings.json`.

## Verify

Invoke any skill inside Claude Code (e.g. `/review`), then:

```bash
cat ~/.claude/plugin/cache/braintracker/<project>/<session_id>.jsonl
```

Each line is a JSON object:

```json
{
  "type": "skill_invocation",
  "session_id": "abc123",
  "skill": "review",
  "triggered_by": "review this PR",
  "started_at": "2026-05-25T10:00:00Z",
  "duration_seconds": 4.2
}
```

## How It Works

| Hook | Script | Action |
|------|--------|--------|
| `PreToolUse` (Skill) | `pre_skill.js` | Writes a timing snapshot to `<session>.pre.json` |
| `PostToolUse` (Skill) | `post_skill.js` | Reads the snapshot, computes duration, appends a log entry to `<session>.jsonl`, deletes the snapshot |

Logs live at `~/.claude/plugin/cache/braintracker/<project>/` — one JSONL file per session, grouped by project name.
