# Rocket.Chat Channel Checks

Notification delivery can optionally check that a resolved Rocket.Chat channel exists before
posting a message.

```text
ROCKET_CHAT_CHANNEL_CHECK_ENABLED=false
```

The default is `false`, so existing delivery behavior is unchanged.

## Behavior

When channel checks are disabled, delivery sends the message directly through
`chat.postMessage`.

When channel checks are enabled, delivery calls Rocket.Chat `rooms.info` for the resolved
channel before sending:

- if the channel exists, delivery sends the message normally
- if the channel is missing, delivery fails with `MissingNotificationChannelError`
- missing channels are treated as non-transient and are not retried

The service does not create channels automatically.

## Logs

Channel check logs include:

- `eventId`
- `correlationId`
- `channel`
- `channelCheckEnabled`
- `channelExists`

## Scope

Channel checks run in the notification delivery layer for routed event notifications.
Manual `POST /notifications/send` requests keep their existing behavior.
