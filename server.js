#!/usr/bin/env node
import express from 'express';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = parseInt(process.env.BRIDGE_PORT || '7734', 10);
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN;
const OPENCLAW_TARGET = process.env.OPENCLAW_TARGET || 'REPLACE_ME';
const OPENCLAW_BIN = process.env.OPENCLAW_BIN || 'openclaw';
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT || '120000', 10);
const OWNER_NAME = process.env.OWNER_NAME || '';

if (!BRIDGE_TOKEN || BRIDGE_TOKEN === 'replace-me') {
  console.error('❌ BRIDGE_TOKEN must be set in .env');
  process.exit(1);
}

function auth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  if (
    token.length !== BRIDGE_TOKEN.length ||
    !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(BRIDGE_TOKEN))
  ) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

const rateState = new Map();
function rateLimit(chatId) {
  const now = Date.now();
  const windowMs = 1000;
  const maxRequests = 5;
  const key = String(chatId || 'default');
  const bucket = rateState.get(key) || [];
  const fresh = bucket.filter(ts => ts > now - windowMs);
  if (fresh.length >= maxRequests) return false;
  fresh.push(now);
  rateState.set(key, fresh);
  return true;
}

function buildForwardText(body) {
  const {
    text,
    sender_name,
    sender_username,
    sender_id,
    chat_id,
    message_id,
    reply_to
  } = body;

  const parts = ['[Max]'];
  if (sender_name && sender_name !== OWNER_NAME) parts.push(`[From ${sender_name}]`);
  if (sender_username) parts.push(`(@${sender_username})`);
  if (sender_id) parts.push(`[sender_id:${sender_id}]`);
  if (chat_id) parts.push(`[chat_id:${chat_id}]`);
  if (message_id) parts.push(`[message_id:${message_id}]`);
  if (reply_to) parts.push(`[reply_to:${reply_to}]`);

  return `${parts.join(' ')} ${text}`.trim();
}

function invokeOpenClaw(message) {
  return new Promise((resolve, reject) => {
    const args = [
      'agent',
      '--to', OPENCLAW_TARGET,
      '--message', message,
      '--timeout', String(Math.ceil(REQUEST_TIMEOUT_MS / 1000))
    ];

    let stdout = '';
    let stderr = '';
    let settled = false;

    const proc = spawn(OPENCLAW_BIN, args, {
      env: { ...process.env, OPENCLAW_NONINTERACTIVE: '1' }
    });

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      proc.kill('SIGTERM');
      reject(new Error(`OpenClaw timed out after ${REQUEST_TIMEOUT_MS}ms`));
    }, REQUEST_TIMEOUT_MS);

    proc.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    proc.on('error', err => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    proc.on('close', code => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(stderr.trim() || `openclaw exited with code ${code}`));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

app.post('/webhook/incoming', auth, async (req, res) => {
  const { chat_id, text } = req.body || {};

  if (!chat_id) {
    return res.status(400).json({ error: 'Missing chat_id' });
  }

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid text' });
  }

  if (!rateLimit(chat_id)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const message = buildForwardText(req.body);
  console.log(`📨 [${chat_id}] ${message.slice(0, 200)}`);

  try {
    const reply = await invokeOpenClaw(message);

    if (!reply || reply === 'NO_REPLY' || reply === 'HEARTBEAT_OK') {
      return res.status(204).send();
    }

    return res.status(200).json({
      response_text: reply,
      response_type: 'text',
      actions: []
    });
  } catch (error) {
    console.error('Agent error:', error.message);
    return res.status(502).json({ error: `Agent failed: ${error.message}` });
  }
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '3.0.0',
    uptime: process.uptime(),
    target: OPENCLAW_TARGET,
    port: PORT
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌉 Max Bridge on port ${PORT}`);
  console.log(`🎯 OpenClaw target: ${OPENCLAW_TARGET}`);
  console.log('📨 POST /webhook/incoming');
  console.log('❤️  GET /health');
});
