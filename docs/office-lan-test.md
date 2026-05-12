# Office LAN Test Runbook

This runbook verifies the Rocket.Chat notification stack from other machines in the same
office network. It does not require reverse proxy or HTTPS for the test.

## Network Layout

```text
office client machines
  -> server machine:3100 Rocket.Chat UI
  -> server machine:4000 notification-service
  -> server machine:4222 NATS

server machine
  -> Docker Desktop
  -> Rocket.Chat + MongoDB
  -> NATS JetStream
  -> notification-service
```

Use one server machine to run Docker, Rocket.Chat, NATS, and the notification service.
Office client machines are other PCs on the same LAN that open the UI, call HTTP endpoints,
or publish NATS events.

## Ports

Open these ports on the server machine:

| Port | Service | Used by |
| --- | --- | --- |
| `3100` | Rocket.Chat UI/API | browsers, login API, notification-service |
| `4000` | notification-service | health, ready, metrics, HTTP notifications |
| `4222` | NATS | other microservices and local test publishers |

## Find Server IP On Windows

On the server machine, run:

```powershell
ipconfig
```

Find the active network adapter and use the `IPv4 Address`, for example:

```text
IPv4 Address. . . . . . . . . . . : 192.168.1.25
```

In the examples below, replace `SERVER_IP` with that address.

## Windows Firewall Checklist

On the server machine:

- Allow inbound TCP `3100` for Rocket.Chat.
- Allow inbound TCP `4000` for notification-service.
- Allow inbound TCP `4222` for NATS.
- Make sure the rule applies to the current network profile, usually Private or Domain.
- If the network is marked Public, either change the profile intentionally or include Public
  only for a controlled test.
- Confirm Docker Desktop is running and containers are healthy.

Example PowerShell commands run as Administrator:

```powershell
New-NetFirewallRule -DisplayName "Rocket.Chat LAN 3100" -Direction Inbound -Protocol TCP -LocalPort 3100 -Action Allow
New-NetFirewallRule -DisplayName "Notification Service LAN 4000" -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow
New-NetFirewallRule -DisplayName "NATS LAN 4222" -Direction Inbound -Protocol TCP -LocalPort 4222 -Action Allow
```

## Start The Stack On The Server

Start Rocket.Chat and NATS:

```bash
docker compose -f docker-compose.rocketchat.yml up -d
```

Start notification-service on the server:

```bash
yarn dev
```

## Office LAN Environment

For LAN testing, configure `.env` on the server with LAN-reachable URLs:

```text
ROCKET_CHAT_URL=http://SERVER_IP:3100
NATS_URL=nats://SERVER_IP:4222
APP_BASE_URL=http://SERVER_IP:<frontend-port>
```

Use the actual Rocket.Chat credentials:

```text
ROCKET_CHAT_USER_ID=<rocket-chat-user-id>
ROCKET_CHAT_AUTH_TOKEN=<rocket-chat-auth-token>
```

Do not commit real credentials. Restart `yarn dev` after changing `.env`.

## Verify From Another PC

From an office client machine, open:

```text
http://SERVER_IP:3100
http://SERVER_IP:4000/health
http://SERVER_IP:4000/ready
http://SERVER_IP:4000/metrics
```

Expected results:

- Rocket.Chat UI opens on `:3100`.
- `/health` returns `{"status":"ok"}`.
- `/ready` returns `200` when Rocket.Chat URL and token are valid.
- `/metrics` returns Prometheus-style text.

## Send HTTP Notification From Another PC

With curl:

```bash
curl -X POST http://SERVER_IP:4000/notifications/send \
  -H "Content-Type: application/json" \
  -H "x-internal-api-key: <internal-api-key>" \
  -d '{"channel":"#notifications","text":"Office LAN HTTP smoke test"}'
```

If `INTERNAL_API_KEY` is not configured, omit the `x-internal-api-key` header.

With Postman:

- Method: `POST`
- URL: `http://SERVER_IP:4000/notifications/send`
- Header: `Content-Type: application/json`
- Header: `x-internal-api-key: <internal-api-key>` when configured
- Body:

```json
{
  "channel": "#notifications",
  "text": "Office LAN Postman smoke test"
}
```

Confirm the message appears in Rocket.Chat.

## Publish NATS Event From Another Microservice

Other services in the office network should connect to:

```text
nats://SERVER_IP:4222
```

Publish supported events to subjects built as:

```text
{NATS_PREFIX}.{event}
```

With the default prefix:

```text
notifications.finance.budget.exceeded
notifications.project.deadline.overdue
notifications.project.member.overallocated
notifications.monitoring.employee.afk
```

The event payload must match [event-contracts.md](event-contracts.md). The notification
service validates the event, maps it to a Rocket.Chat message, resolves the channel through
routing rules, and sends it to Rocket.Chat.

## Troubleshooting

### Cannot Reach Rocket.Chat UI

Check that `http://SERVER_IP:3100` opens on the server itself first. Then check Docker status:

```bash
docker compose -f docker-compose.rocketchat.yml ps
docker compose -f docker-compose.rocketchat.yml logs -f rocketchat
```

If it works on the server but not on another PC, check Windows Firewall for port `3100` and
confirm both machines are on the same LAN/VPN segment.

### `/ready` Returns `503`

`/ready` checks Rocket.Chat availability from notification-service. Verify:

- `ROCKET_CHAT_URL=http://SERVER_IP:3100`
- Rocket.Chat is reachable from the server
- `ROCKET_CHAT_USER_ID` and `ROCKET_CHAT_AUTH_TOKEN` are valid and from the same login
- notification-service was restarted after `.env` changes

### NATS Connection Refused

Check that NATS is running and listening on `4222`:

```bash
docker compose -f docker-compose.rocketchat.yml ps
```

Verify the client uses:

```text
NATS_URL=nats://SERVER_IP:4222
```

Open Windows Firewall inbound TCP `4222`.

### Windows Firewall Blocks Port

Temporarily test from another PC with:

```powershell
Test-NetConnection SERVER_IP -Port 4000
Test-NetConnection SERVER_IP -Port 3100
Test-NetConnection SERVER_IP -Port 4222
```

If `TcpTestSucceeded` is `False`, review inbound firewall rules and the active network
profile on the server.

### Wrong Rocket.Chat Token

Refresh credentials with the Rocket.Chat login API against the LAN URL:

```bash
curl -X POST http://SERVER_IP:3100/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"user":"admin","password":"change-me"}'
```

Update `.env` with `userId` and `authToken`, then restart notification-service.

### Channel Missing

Create the target channel in Rocket.Chat, for example `notifications`, and send to it as:

```text
#notifications
```

If `ROCKET_CHAT_CHANNEL_CHECK_ENABLED=true`, missing channels fail before `chat.postMessage`
and are not retried.

### Docker Desktop Not Running

Start Docker Desktop and wait until the engine is ready. Then retry:

```bash
docker compose -f docker-compose.rocketchat.yml ps
```

### `host.docker.internal` Does Not Work On Linux

This runbook uses `SERVER_IP` because it works across office client machines. On Linux,
`host.docker.internal` is not guaranteed unless explicitly configured. Prefer LAN-reachable
addresses for office tests.

## Recommended Later

For production-like office use, add these outside this runbook:

- reverse proxy in front of Rocket.Chat and notification-service
- HTTPS certificates
- stable DNS name instead of raw `SERVER_IP`
- network-level access controls for NATS
- dedicated Rocket.Chat bot user and scoped credentials
