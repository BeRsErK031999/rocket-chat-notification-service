# Deployment

The service can run as a standalone container. The image builds TypeScript and runs
`dist/server.js`.

## Build Image

```bash
docker build -t rocket-chat-notification-service:local .
```

## Run Container

```bash
docker run --rm -p 4000:4000 \
  -e PORT=4000 \
  -e ROCKET_CHAT_URL=http://host.docker.internal:3000 \
  -e ROCKET_CHAT_USER_ID=<rocket-chat-user-id> \
  -e ROCKET_CHAT_AUTH_TOKEN=<rocket-chat-auth-token> \
  -e NATS_URL=nats://host.docker.internal:4222 \
  rocket-chat-notification-service:local
```

## Compose

Start Rocket.Chat and NATS:

```bash
docker compose -f docker-compose.rocketchat.yml up -d
```

Start the notification service container:

```bash
docker compose -f docker-compose.service.yml up --build
```

When running the service compose file separately, the default URLs point to
`host.docker.internal`. Override `ROCKET_CHAT_URL` and `NATS_URL` if your Docker runtime or
network topology needs different hostnames.

## Required Env

```text
PORT=4000
ROCKET_CHAT_URL=http://host.docker.internal:3000
ROCKET_CHAT_USER_ID=<rocket-chat-user-id>
ROCKET_CHAT_AUTH_TOKEN=<rocket-chat-auth-token>
NATS_URL=nats://host.docker.internal:4222
NATS_PREFIX=notifications
NATS_STREAM_NAME=NOTIFICATIONS
NATS_DURABLE_PREFIX=rocket-chat-notification-service
NATS_DLQ_SUBJECT=notifications.dlq
DELIVERY_RETRY_ATTEMPTS=3
DELIVERY_RETRY_DELAY_MS=500
DEFAULT_NOTIFICATION_CHANNEL=general
FINANCE_ALERTS_CHANNEL=finance-alerts
PROJECT_ALERTS_CHANNEL_PREFIX=project-
MONITORING_ALERTS_CHANNEL=monitoring-alerts
```

## Ports And Endpoints

Container port:

```text
4000
```

Endpoints:

- `GET /health`
- `GET /ready`
- `GET /metrics`
- `POST /notifications/send`

No Kubernetes, Helm, CI/CD, Redis, or database setup is included at this stage.
