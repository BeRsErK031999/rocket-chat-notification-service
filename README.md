# Rocket.Chat Notification Service

Standalone Node.js/TypeScript microservice for sending notifications to Rocket.Chat.

The service accepts notification events from internal services, transforms them into messages, and sends them through the Rocket.Chat REST API. NATS consumers are intentionally not connected yet; the current HTTP route is the first integration surface.

## Stack

- Node.js
- TypeScript
- Fastify
- Zod
- dotenv
- pino
- Vitest
- ESLint
- Prettier
- tsx
- yarn

## Setup

```bash
yarn install
cp .env.example .env
```

Fill `.env` with Rocket.Chat credentials.

## Development workflow

Use `yarn` for all package and script commands.

```bash
yarn install
yarn dev
```

Before opening a pull request or pushing a branch, run:

```bash
yarn type-check
yarn lint
yarn test
```

Keep changes focused on the standalone notification service. NATS consumers are intentionally
left as a future extension point.

## Architecture overview

The service exposes HTTP endpoints for notification delivery and forwards accepted messages to
Rocket.Chat through its REST API.

```mermaid
flowchart LR
  A[notification-service] --> B[Rocket.Chat]
  B --> C[channels/users]
```

## Local Rocket.Chat smoke test

Start the local Rocket.Chat infrastructure:

```bash
docker compose -f docker-compose.rocketchat.yml up -d
```

Open `http://localhost:3000`, create the first admin/user, create a channel, and get a
Rocket.Chat user id and auth token. See [docs/local-rocketchat.md](docs/local-rocketchat.md)
for the full step-by-step flow.

Fill `.env` with the local Rocket.Chat values:

```bash
PORT=4000
ROCKET_CHAT_URL=http://localhost:3000
ROCKET_CHAT_USER_ID=<rocket-chat-user-id>
ROCKET_CHAT_AUTH_TOKEN=<rocket-chat-auth-token>
```

Run the notification service locally:

```bash
yarn dev
```

Send a test notification:

```bash
curl -X POST http://localhost:4000/notifications/send \
  -H "Content-Type: application/json" \
  -d '{"channel":"#notifications","text":"Local Rocket.Chat smoke test"}'
```

## Commands

```bash
yarn dev
yarn build
yarn start
yarn type-check
yarn lint
yarn test
yarn format
```

## API

### `GET /health`

```json
{
  "status": "ok"
}
```

### `GET /ready`

```json
{
  "status": "ok"
}
```

### `POST /notifications/send`

```json
{
  "channel": "#finance",
  "text": "Payment deadline changed"
}
```

Successful response:

```json
{
  "ok": true
}
```
