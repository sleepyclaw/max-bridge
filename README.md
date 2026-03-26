# Max Bridge

A small, clean HTTP bridge between a Max bot webhook and OpenClaw.

Max Bridge accepts incoming webhook messages, forwards them to OpenClaw, and returns the assistant reply directly in the HTTP response. The whole point is to stay simple: one service, one file, one job.

## Why this exists

- lightweight webhook → OpenClaw bridge
- synchronous request/response flow
- tiny deployment surface
- easy to run under systemd
- easy to understand and modify

## Design

This repo is intentionally simple:
- one Node service
- one main file: `server.js`
- no polling sidecar
- no outbound callback logic
- default port `7734`

## Environment

Copy `.env.example` to `.env` and fill in:

```bash
BRIDGE_PORT=7734
BRIDGE_TOKEN=replace-me
OPENCLAW_TARGET=replace-with-your-target
```

Optional:

```bash
OPENCLAW_BIN=openclaw
REQUEST_TIMEOUT=120000
OWNER_NAME=
```

## API

### `POST /webhook/incoming`

Authenticate with a bearer token and send a JSON payload like:

```json
{
  "message_id": "msg_123",
  "sender_id": "user_456",
  "sender_name": "User Name",
  "sender_username": "username",
  "chat_id": "chat_789",
  "text": "Hello!",
  "reply_to": null
}
```

Possible responses:
- `200 OK` with a direct reply body
- `204 No Content` when OpenClaw returns no reply
- `401 Unauthorized`
- `429 Too Many Requests`
- `502 Bad Gateway`

### `GET /health`

Returns service health info.

## Local run

```bash
npm install
cp .env.example .env
npm start
```

## systemd

Install `max-bridge.service` and point it at this repo checkout.
