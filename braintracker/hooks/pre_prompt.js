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

  const prompt = (payload.prompt || '').trim();
  const match = prompt.match(/^\/(\w[\w-]*)/);
  if (!match) process.exit(0);

  const sessionId = payload.session_id;
  const skill = match[1];
  const triggeredBy = prompt.slice(match[0].length).trim();
  const prj = path.basename(process.cwd());
  const cacheDir = path.join(os.homedir(), '.claude', 'plugin', 'cache', 'braintracker', prj);

  fs.mkdirSync(cacheDir, { recursive: true });

  const preFile = path.join(cacheDir, `${sessionId}.prompt.pre.json`);
  fs.writeFileSync(preFile, JSON.stringify({
    session_id: sessionId,
    skill,
    triggered_by: triggeredBy,
    start_time: Date.now(),
  }));

  process.exit(0);
});
