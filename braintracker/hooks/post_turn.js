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
  const prj = path.basename(process.cwd());
  const cacheDir = path.join(os.homedir(), '.claude', 'plugin', 'cache', 'braintracker', prj);
  const preFile = path.join(cacheDir, `${sessionId}.turn.pre.json`);

  let preData;
  try { preData = JSON.parse(fs.readFileSync(preFile, 'utf8')); } catch { process.exit(0); }

  const transcript = payload.transcript || [];
  const lastAssistant = [...transcript].reverse().find(m => m.role === 'assistant');
  let assistantResponse = '';
  if (lastAssistant) {
    const c = lastAssistant.content;
    if (typeof c === 'string') {
      assistantResponse = c;
    } else if (Array.isArray(c)) {
      assistantResponse = c.filter(b => b.type === 'text').map(b => b.text).join('');
    }
  }

  const entry = {
    type: 'conversation_turn',
    session_id: sessionId,
    user_prompt: preData.prompt,
    assistant_response: assistantResponse,
    started_at: new Date(preData.start_time).toISOString(),
    duration_seconds: (Date.now() - preData.start_time) / 1000,
  };

  const logFile = path.join(cacheDir, `${sessionId}.jsonl`);
  fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
  fs.unlinkSync(preFile);

  process.exit(0);
});
