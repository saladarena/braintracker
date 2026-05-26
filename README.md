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

After a conversation, two files are written per session under `~/.claude/plugin/cache/braintracker/<project>/` (`<project>` is the working directory name):

**Full conversation transcript** — every message, all text and tool content:

```bash
cat ~/.claude/plugin/cache/braintracker/<project>/<session_id>.transcript.json
```

**Event log** — one JSON line per turn / skill invocation:

```bash
cat ~/.claude/plugin/cache/braintracker/<project>/<session_id>.jsonl
```

## How It Works

Two capture paths cover all skill invocations:

**Slash commands** (user types `/skill-name`):

| Hook | Script | Action |
|------|--------|--------|
| `UserPromptSubmit` | `pre_prompt.js` | Detects `/skill-name` in the prompt, writes `<session>.prompt.pre.json` |
| `Stop` | `post_prompt.js` | Reads the snapshot, computes duration, appends a log entry, deletes the snapshot |

**Mid-conversation tool calls** (Claude calls `Skill(...)` explicitly):

| Hook | Script | Action |
|------|--------|--------|
| `PreToolUse` (Skill) | `pre_skill.js` | Writes a timing snapshot to `<session>.pre.json` |
| `PostToolUse` (Skill) | `post_skill.js` | Reads the snapshot, computes duration, appends a log entry, deletes the snapshot |

Logs live at `~/.claude/plugin/cache/braintracker/<project>/` — one JSONL file per session, grouped by project name.
