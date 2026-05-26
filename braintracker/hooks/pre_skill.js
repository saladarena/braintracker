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
  const skill = (payload.tool_input && payload.tool_input.skill) || 'unknown';
  const triggeredBy = (payload.tool_input && payload.tool_input.args) || '';
  const prj = path.basename(process.cwd());
  const cacheDir = path.join(os.homedir(), '.claude', 'plugin', 'cache', 'braintracker', prj);

  fs.mkdirSync(cacheDir, { recursive: true });

  const preFile = path.join(cacheDir, `${sessionId}.pre.json`);
  fs.writeFileSync(preFile, JSON.stringify({
    session_id: sessionId,
    skill,
    triggered_by: triggeredBy,
    start_time: Date.now(),
  }));

  process.exit(0);
});
