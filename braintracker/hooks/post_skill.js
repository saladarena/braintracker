#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

let raw = '';
process.stdin.on('data', chunk => (raw += chunk));
process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  if (payload.tool_name !== 'Skill') process.exit(0);

  const sessionId = payload.session_id;
  const prj = path.basename(process.cwd());
  const cacheDir = path.join(os.homedir(), '.claude', 'plugin', 'cache', 'braintracker', prj);
  const preFile = path.join(cacheDir, `${sessionId}.pre.json`);

  let preData;
  try {
    preData = JSON.parse(fs.readFileSync(preFile, 'utf8'));
  } catch {
    process.exit(0);
  }

  const durationSeconds = (Date.now() - preData.start_time) / 1000;
  const entry = {
    type: 'skill_invocation',
    session_id: sessionId,
    skill: preData.skill,
    triggered_by: preData.triggered_by,
    started_at: new Date(preData.start_time).toISOString(),
    duration_seconds: durationSeconds,
  };

  const logFile = path.join(cacheDir, `${sessionId}.jsonl`);
  fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
  fs.unlinkSync(preFile);

  process.exit(0);
});
