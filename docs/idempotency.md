# Idempotency

Notification service uses an in-memory idempotency guard for NATS event delivery.

## Configuration

```text
IDEMPOTENCY_TTL_MS=86400000
```

The default TTL is 24 hours. Processed event ids are kept in memory until they expire or the
process restarts.

## Behavior

After a NATS event is successfully delivered to Rocket.Chat, its `eventId` is recorded.

If another event with the same `eventId` is received before the TTL expires:

- Rocket.Chat delivery is skipped
- consumer handler returns `duplicate_skipped`
- JetStream message is acknowledged
- `events_processed_total{event,result="duplicate_skipped"}` is incremented
- structured logs include `eventId` and `result=duplicate_skipped`

These results do not record the `eventId` as processed:

- `validation_failed`
- `mapping_failed`
- `delivery_failed`

The guard applies only to NATS event flow. Manual `POST /notifications/send` requests are not
deduplicated.

## Limitations

This is not a distributed idempotency store. Multiple service instances each keep their own
memory. A process restart clears the store. A future production setup can replace this with
Redis or a database-backed store without changing event contracts.
