# Max Bridge API Contract

**Base URL:** `https://your-domain.example`

## Authentication

All requests must include:

```http
Authorization: Bearer <token>
```

## Endpoints

### POST `/webhook/incoming`

Forward one incoming Max message to OpenClaw and get a direct reply.

Request:

```json
{
  "message_id": "msg_12345",
  "sender_id": "user_98765",
  "sender_name": "Example User",
  "sender_username": "example_user",
  "chat_id": "chat_456",
  "text": "Hello, how are you?",
  "timestamp": "2026-03-22T10:21:00Z",
  "reply_to": null,
  "attachments": []
}
```

Successful response:

```json
{
  "response_text": "I'm doing well, thanks for asking!",
  "response_type": "text",
  "actions": []
}
```

Possible statuses:
- `200 OK` — reply returned
- `204 No Content` — no reply needed
- `401 Unauthorized` — invalid token
- `429 Too Many Requests` — per-chat rate limit
- `502 Bad Gateway` — OpenClaw invocation failed

### GET `/health`

Response:

```json
{
  "status": "ok",
  "version": "3.0.0",
  "uptime": 12345,
  "target": "replace-with-your-target",
  "port": 7734
}
```
