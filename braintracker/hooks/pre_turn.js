#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

let raw = '';
process.stdin.on('data', chunk => (raw += chunk));
process.stdin.on('end', () => {
  let payload;
  try { payload = JSON.parse(raw); } catch { process.exit(0); }

  const sessionId = payload.session_id;
  const prompt = (payload.prompt || '').trim();
  const prj = path.basename(process.cwd());
  const cacheDir = path.join(os.homedir(), '.claude', 'plugin', 'cache', 'braintracker', prj);

  fs.mkdirSync(cacheDir, { recursive: true });

  const preFile = path.join(cacheDir, `${sessionId}.turn.pre.json`);
  fs.writeFileSync(preFile, JSON.stringify({
    session_id: sessionId,
    prompt,
    start_time: Date.now(),
  }));

  process.exit(0);
});
