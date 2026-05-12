# Single-User Local MVP

This runbook verifies the local one-developer flow:

```text
Rocket.Chat UI -> notification-service -> NATS JetStream -> Rocket.Chat message
```

It intentionally stays local-only. It does not add multi-user support, office LAN access,
Tailscale, VPS, HTTPS, reverse proxying, or automatic channel creation.

## 1. Start Rocket.Chat, MongoDB, And NATS

```bash
docker compose -f docker-compose.rocketchat.yml up -d
```

Rocket.Chat is published on:

```text
http://localhost:3100
```

Port `3000` is not used by Rocket.Chat in this project because it may already be occupied by
Grafana.

Check containers if startup takes time:

```bash
docker compose -f docker-compose.rocketchat.yml ps
docker compose -f docker-compose.rocketchat.yml logs -f rocketchat
```

The first boot can take several minutes.

## 2. Complete Rocket.Chat Setup

Open:

```text
http://localhost:3100
```

Complete the setup wizard. If the local Mongo volume was reset with `down -v`, Rocket.Chat
will ask for first-run setup again.

Create one local service/bot user for `notification-service`. The MVP assumes one local
developer and one Rocket.Chat user/token used by the service.

Create these public channels in Rocket.Chat:

```text
general
finance-alerts
monitoring-alerts
project-project-123
```

The service does not create channels automatically. With channel checks enabled, a missing
channel fails before message delivery.

## 3. Get Rocket.Chat Auth Token

Use the local service/bot username and password:

```bash
curl -X POST http://localhost:3100/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"user":"notification-service","password":"change-me"}'
```

Copy these values from the response:

```json
{
  "data": {
    "userId": "<local-user-id>",
    "authToken": "<local-auth-token>"
  }
}
```

Do not commit real local credentials.

## 4. Create Local `.env`

```bash
cp .env.local.example .env
```

Set the local token values:

```text
PORT=4000
ROCKET_CHAT_URL=http://localhost:3100
ROCKET_CHAT_USER_ID=<local-user-id>
ROCKET_CHAT_AUTH_TOKEN=<local-auth-token>
NATS_URL=nats://localhost:4222
INTERNAL_API_KEY=local-dev-key
DEFAULT_NOTIFICATION_CHANNEL=general
FINANCE_ALERTS_CHANNEL=finance-alerts
PROJECT_ALERTS_CHANNEL_PREFIX=project-
MONITORING_ALERTS_CHANNEL=monitoring-alerts
ROCKET_CHAT_CHANNEL_CHECK_ENABLED=true
```

Keep the other defaults from `.env.local.example` unless the local stack changes.

## 5. Start notification-service

```bash
yarn install
yarn dev
```

Keep this process running.

## 6. Check Service Endpoints

In another terminal:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/ready
curl http://localhost:4000/metrics
```

Or run the lightweight local smoke check:

```bash
yarn smoke:local
```

Expected:

- `/health` returns `200`
- `/ready` returns `200` when Rocket.Chat is reachable and credentials are valid
- `/metrics` returns Prometheus-style text

## 7. Send HTTP Notification To `general`

```bash
curl -X POST http://localhost:4000/notifications/send \
  -H "Content-Type: application/json" \
  -H "x-internal-api-key: local-dev-key" \
  -d '{"channel":"#general","text":"Single-user local MVP HTTP notification"}'
```

Check the `#general` channel in Rocket.Chat.

## 8. Send NATS Event Through JetStream

```bash
yarn publish:test-event
```

The current test event is `finance.budget.exceeded`, so the routing layer sends it to the
configured finance channel:

```text
finance-alerts
```

Check `#finance-alerts` in the Rocket.Chat UI.

## 9. Check DLQ

```bash
yarn dlq:last
```

If delivery succeeded and no event was sent to the DLQ, this command may report that there is
no message available. That is expected for a successful smoke run.

If a DLQ message exists, inspect `failureReason`, `originalSubject`, and `originalPayload`.
Common local causes are invalid Rocket.Chat credentials, missing channels, or Rocket.Chat not
being ready yet.

## 10. Stop Local Services

Stop `yarn dev` with:

```text
Ctrl+C
```

Stop containers while keeping MongoDB data:

```bash
docker compose -f docker-compose.rocketchat.yml down
```

Stop containers and reset Rocket.Chat setup data:

```bash
docker compose -f docker-compose.rocketchat.yml down -v
```
