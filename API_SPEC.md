# Max Bridge API Contract

## Authentication

All requests must include:

```http
Authorization: Bearer <token>
```

## Endpoints

### `POST /webhook/incoming`

Forward one incoming Max message to OpenClaw and return a direct reply.

Example request:

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

Example success response:

```json
{
  "response_text": "I'm doing well, thanks for asking!",
  "response_type": "text",
  "actions": []
}
```

Statuses:
- `200 OK`
- `204 No Content`
- `401 Unauthorized`
- `429 Too Many Requests`
- `502 Bad Gateway`

### `GET /health`

Example response:

```json
{
  "status": "ok",
  "version": "3.0.0",
  "uptime": 12345,
  "target": "replace-with-your-target",
  "port": 7734
}
```
