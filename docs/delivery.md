# Notification Delivery

Rocket.Chat delivery uses a controlled in-process retry policy. It does not use Redis or a
database.

## Retry Settings

```text
DELIVERY_RETRY_ATTEMPTS=3
DELIVERY_RETRY_DELAY_MS=500
```

`DELIVERY_RETRY_ATTEMPTS` is the total number of attempts, including the first delivery try.
`DELIVERY_RETRY_DELAY_MS` is the delay before each retry.

## Behavior

Retries happen only after a valid event has been mapped to a notification and Rocket.Chat
delivery fails.

No retry is attempted for:

- `validation_failed`
- `mapping_failed`
- `duplicate_skipped`

Retry logs include:

- `eventId`
- `correlationId`
- `attempt`
- `maxAttempts`
- `delayMs`

If all attempts fail, the consumer handler returns `delivery_failed`. If any retry succeeds, it
returns `success`.

With JetStream enabled, `delivery_failed` events are published to the DLQ subject and the
original message is acknowledged. See [jetstream.md](jetstream.md).
