# Local Rocket.Chat

This guide starts Rocket.Chat, MongoDB, and NATS locally with Docker Compose. The
notification-service still runs on the host with `yarn dev`.

## 1. Start Rocket.Chat

```bash
docker compose -f docker-compose.rocketchat.yml up -d
```

Rocket.Chat can take a few minutes to finish the first boot. Check status with:

```bash
docker compose -f docker-compose.rocketchat.yml ps
docker compose -f docker-compose.rocketchat.yml logs -f rocketchat
```

## 2. Open the UI

Open:

```text
http://localhost:3000
```

Complete the first-run setup in the Rocket.Chat UI.

## 3. Create a User

For a local smoke test, the first admin user is enough. You can also create a
separate test user in the Rocket.Chat UI under administration/users.

## 4. Create a Channel

Create a public channel for the smoke test, for example:

```text
notifications
```

When sending through this service, use the channel value with a leading `#`:

```text
#notifications
```

## 5. Get User ID and Auth Token

Use the Rocket.Chat login API with the local username and password you created:

```bash
curl -X POST http://localhost:3000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"user":"admin","password":"change-me"}'
```

The response contains the values needed by this service:

```json
{
  "status": "success",
  "data": {
    "userId": "<rocket-chat-user-id>",
    "authToken": "<rocket-chat-auth-token>"
  }
}
```

Do not commit real `userId` or `authToken` values.

## 6. Fill `.env`

Copy the example file if needed:

```bash
cp .env.example .env
```

Set the local values:

```bash
PORT=4000
LOG_LEVEL=info
ROCKET_CHAT_URL=http://localhost:3000
ROCKET_CHAT_USER_ID=<rocket-chat-user-id>
ROCKET_CHAT_AUTH_TOKEN=<rocket-chat-auth-token>
```

`PORT=4000` keeps the notification-service from conflicting with Rocket.Chat on
`localhost:3000`.

## 7. Start notification-service

```bash
yarn dev
```

Check the service health endpoint:

```bash
curl http://localhost:4000/health
```

## 8. Send a Test Notification

```bash
curl -X POST http://localhost:4000/notifications/send \
  -H "Content-Type: application/json" \
  -d '{"channel":"#notifications","text":"Local Rocket.Chat smoke test"}'
```

Expected response:

```json
{
  "ok": true
}
```

The message should appear in the Rocket.Chat `#notifications` channel.

## 9. Stop the Environment

Stop containers but keep MongoDB data:

```bash
docker compose -f docker-compose.rocketchat.yml down
```

Stop containers and remove the MongoDB volume:

```bash
docker compose -f docker-compose.rocketchat.yml down -v
```

## Troubleshooting

### Rocket.Chat is still starting

First boot can take several minutes while MongoDB initializes and Rocket.Chat
prepares the workspace.

```bash
docker compose -f docker-compose.rocketchat.yml ps
docker compose -f docker-compose.rocketchat.yml logs -f rocketchat
```

Wait until `http://localhost:3000` opens and the setup screen or login screen is
available.

### Invalid Token

If `/notifications/send` returns an upstream Rocket.Chat error, refresh the
credentials with the login API and update:

```text
ROCKET_CHAT_USER_ID
ROCKET_CHAT_AUTH_TOKEN
```

Make sure both values come from the same login response.

### Channel Not Found

Create the channel in the Rocket.Chat UI and use the exact channel name in the
request body. Public channels are sent as `#channel-name`.

### Port Is Busy

Rocket.Chat uses `localhost:3000`. The notification-service example uses
`PORT=4000`. If either port is busy, stop the conflicting process or update the
host port in `docker-compose.rocketchat.yml` and the matching URL in `.env`.

### Mongo Volume Needs Reset

If the local Rocket.Chat setup is in a bad state, remove the MongoDB volume:

```bash
docker compose -f docker-compose.rocketchat.yml down -v
docker compose -f docker-compose.rocketchat.yml up -d
```
