# E2E Smoke Test

This runbook verifies the local flow:

```text
Rocket.Chat + NATS JetStream -> notification-service -> Rocket.Chat
```

It uses Docker Compose for Rocket.Chat, MongoDB, and NATS. The notification service runs on
the host with `yarn dev`.

## 1. Start Rocket.Chat And NATS

```bash
docker compose -f docker-compose.rocketchat.yml up -d
```

Check status:

```bash
docker compose -f docker-compose.rocketchat.yml ps
docker compose -f docker-compose.rocketchat.yml logs -f rocketchat
```

Rocket.Chat can take several minutes on the first boot.

## 2. Create Rocket.Chat User

Open:

```text
http://localhost:3100
```

Complete first-run setup and create an admin or test user.

Create a public channel:

```text
notifications
```

The service sends to it as:

```text
#notifications
```

## 3. Get Auth Token

Use the Rocket.Chat login API with the local username and password:

```bash
curl -X POST http://localhost:3100/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"user":"admin","password":"change-me"}'
```

Copy these values from the response:

```json
{
  "data": {
    "userId": "<rocket-chat-user-id>",
    "authToken": "<rocket-chat-auth-token>"
  }
}
```

Do not commit real credentials.

## 4. Fill `.env`

```bash
cp .env.example .env
```

Set:

```text
PORT=4000
LOG_LEVEL=info
ROCKET_CHAT_URL=http://localhost:3100
ROCKET_CHAT_USER_ID=<rocket-chat-user-id>
ROCKET_CHAT_AUTH_TOKEN=<rocket-chat-auth-token>
INTERNAL_API_KEY=<internal-api-key>
NATS_URL=nats://localhost:4222
NATS_PREFIX=notifications
NATS_STREAM_NAME=NOTIFICATIONS
NATS_DURABLE_PREFIX=rocket-chat-notification-service
NATS_DLQ_SUBJECT=notifications.dlq
DELIVERY_RETRY_ATTEMPTS=3
DELIVERY_RETRY_DELAY_MS=500
IDEMPOTENCY_TTL_MS=86400000
DEFAULT_NOTIFICATION_CHANNEL=general
FINANCE_ALERTS_CHANNEL=finance-alerts
PROJECT_ALERTS_CHANNEL_PREFIX=project-
MONITORING_ALERTS_CHANNEL=monitoring-alerts
```

## 5. Start notification-service

```bash
yarn install
yarn dev
```

Keep this process running.

## 6. Check HTTP Endpoints

In another terminal:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/ready
curl http://localhost:4000/metrics
```

Or run:

```bash
yarn smoke:http
```

Expected:

- `/health` returns `200`
- `/ready` returns `200` when Rocket.Chat credentials are valid
- `/metrics` returns Prometheus-style text

## 7. Send HTTP Notification

```bash
curl -X POST http://localhost:4000/notifications/send \
  -H "Content-Type: application/json" \
  -H "x-internal-api-key: <internal-api-key>" \
  -d '{"channel":"#notifications","text":"Local HTTP smoke test"}'
```

If `INTERNAL_API_KEY` is not set in `.env`, omit the `x-internal-api-key` header.

Expected response:

```json
{
  "ok": true
}
```

Check the `#notifications` channel in Rocket.Chat.

## 8. Send NATS Event

```bash
yarn publish:test-event
```

Expected:

- service logs contain structured event fields
- `/metrics` includes event and delivery counters
- Rocket.Chat receives the mapped notification in `#notifications`

## 9. Check DLQ

If delivery fails after retry, the original event is published to the DLQ subject.

Read the latest DLQ message:

```bash
yarn dlq:last
```

If there are no DLQ messages, this command may return a JetStream no-message error. That is
expected for a successful smoke test.

## 10. Stop Environment

Stop service:

```text
Ctrl+C
```

Stop containers but keep MongoDB data:

```bash
docker compose -f docker-compose.rocketchat.yml down
```

Stop containers and remove MongoDB data:

```bash
docker compose -f docker-compose.rocketchat.yml down -v
```

## Troubleshooting

### Docker Desktop is not running

Docker commands may fail with a missing Docker Desktop Linux engine or pipe error. Start Docker
Desktop and wait until it reports that the engine is running, then retry:

```bash
docker compose -f docker-compose.rocketchat.yml ps
```

### Rocket.Chat takes a long time to start

First boot can take several minutes. Watch logs:

```bash
docker compose -f docker-compose.rocketchat.yml logs -f rocketchat
```

Wait until `http://localhost:3100` opens.

### `/ready` returns `503`

`/ready` checks Rocket.Chat availability. Verify:

- `ROCKET_CHAT_URL=http://localhost:3100`
- Rocket.Chat is reachable in the browser
- `ROCKET_CHAT_USER_ID` and `ROCKET_CHAT_AUTH_TOKEN` are from the same login response

### Invalid Rocket.Chat token

Refresh credentials with:

```bash
curl -X POST http://localhost:3100/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"user":"admin","password":"change-me"}'
```

Update `.env` and restart `yarn dev`.

### NATS stream missing

The service creates or updates the JetStream stream on startup. If `yarn publish:test-event`
fails before the service has started, start `yarn dev` first and retry. The publisher also
attempts local stream setup.

### Message went to DLQ

Run:

```bash
yarn dlq:last
```

Check `failureReason`, `originalSubject`, and `originalPayload`. Common causes are invalid
Rocket.Chat credentials, a missing channel, or Rocket.Chat being unavailable during delivery.

### Channel not found

Create the `notifications` public channel in Rocket.Chat and use `#notifications` in payloads.
For private channels or direct messages, verify the bot/user represented by the token can post
there.
