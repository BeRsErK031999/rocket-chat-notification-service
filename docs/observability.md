# Observability

Notification service exposes Prometheus-style text metrics at:

```text
GET /metrics
```

The registry is in-memory and resets when the process restarts. No Prometheus client library,
OpenTelemetry, histogram, or external storage is used at this stage.

## Metrics

```text
http_requests_total{method,path,status}
events_processed_total{event,result}
notifications_delivery_attempts_total{result}
notifications_delivery_retries_total
dlq_published_total{event}
rocket_chat_healthcheck_total{result}
```

## Result Labels

`events_processed_total` uses the existing processing result values:

- `success`
- `duplicate_skipped`
- `validation_failed`
- `mapping_failed`
- `delivery_failed`

`notifications_delivery_attempts_total` uses:

- `success`
- `failure`

`rocket_chat_healthcheck_total` uses:

- `success`
- `failure`
