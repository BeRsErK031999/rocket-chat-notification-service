# JetStream Delivery

Notification service uses NATS JetStream for durable event delivery.

## Configuration

```text
NATS_STREAM_NAME=NOTIFICATIONS
NATS_DURABLE_PREFIX=rocket-chat-notification-service
NATS_DLQ_SUBJECT=notifications.dlq
```

The service creates or updates the stream during startup for local/dev usage. Stream subjects
cover all supported event subjects and the DLQ subject.

## Durable Consumers

Durable consumer names are derived from `NATS_DURABLE_PREFIX`:

- `rocket-chat-notification-service-finance-notifications`
- `rocket-chat-notification-service-project-notifications`
- `rocket-chat-notification-service-monitoring-notifications`

Consumers use explicit ack and `max_deliver: 1`. In-process delivery retry still happens before
the final processing result is returned.

## Ack Strategy

- `success` -> ack original message
- `validation_failed` -> ack original message
- `mapping_failed` -> ack original message
- `delivery_failed` -> publish DLQ payload, then ack original message

This avoids infinite redelivery loops. Invalid payloads and mapper failures are acknowledged
because retrying the same payload will not repair it.

## DLQ

DLQ subject:

```text
notifications.dlq
```

DLQ payload includes:

- `originalSubject`
- `eventId`
- `correlationId`
- `event`
- `source`
- `severity`
- `failureReason`
- `failedAt`
- `originalPayload`

Read the latest local DLQ message:

```bash
yarn dlq:last
```
