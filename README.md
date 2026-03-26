# Max Bridge

Simple bridge between a Max bot webhook and OpenClaw.

## What it does

- accepts Max webhook messages on `POST /webhook/incoming`
- authenticates them with a shared bearer token
- forwards the message to an OpenClaw target you configure
- returns the assistant reply directly in the HTTP response

This deployment is intentionally simple:
- one Node service
- no polling sidecar
- no outbound/proactive callback logic
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

### POST `/webhook/incoming`

Headers:

```http
Authorization: Bearer <BRIDGE_TOKEN>
Content-Type: application/json
```

Body example:

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

Response when a reply exists:

```json
{
  "response_text": "Hi there!",
  "response_type": "text",
  "actions": []
}
```

If OpenClaw returns `NO_REPLY` or `HEARTBEAT_OK`, the bridge returns:

- `204 No Content`

### GET `/health`

Returns basic health info.

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

## systemd

Example unit file is included as `max-bridge.service`.
