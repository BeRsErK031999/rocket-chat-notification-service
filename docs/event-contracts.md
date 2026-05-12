# Event Contracts

Notification service consumes JSON events from NATS subjects built as:

```text
{NATS_PREFIX}.{event}
```

Default prefix:

```text
notifications
```

## Base Event

```json
{
  "eventId": "018f8f4c-5e4c-7b7a-9b3a-4a3e9a9f9f01",
  "correlationId": "request-123",
  "timestamp": "2026-05-12T00:00:00.000Z",
  "source": "finance-service",
  "event": "finance.budget.exceeded",
  "severity": "critical",
  "payload": {}
}
```

`eventId` is required and should be unique for each published event. `correlationId` is
optional and should be preserved when the event belongs to a larger workflow. `severity` is
optional and supports `info`, `warning`, and `critical`.

Consumer processing returns one of these internal statuses:

- `success`
- `validation_failed`
- `mapping_failed`
- `delivery_failed`

The current service logs failures and does not add persistence, DLQ, JetStream, Redis, or a
database-backed retry queue.

## Supported Events

### `finance.budget.exceeded`

Subject: `notifications.finance.budget.exceeded`

```json
{
  "eventId": "finance-event-1",
  "correlationId": "budget-check-1",
  "event": "finance.budget.exceeded",
  "timestamp": "2026-05-12T00:00:00.000Z",
  "source": "finance-service",
  "severity": "critical",
  "payload": {
    "projectId": "project-1",
    "budgetId": "budget-1",
    "budgetName": "Ops",
    "actualAmount": 120000,
    "limitAmount": 100000,
    "currency": "USD",
    "channel": "#finance"
  }
}
```

`projectId` is optional for backward compatibility. When present and `APP_BASE_URL` is
configured, notification templates can render a finance page link.

### `project.deadline.overdue`

Subject: `notifications.project.deadline.overdue`

```json
{
  "eventId": "project-event-1",
  "correlationId": "deadline-check-1",
  "event": "project.deadline.overdue",
  "timestamp": "2026-05-12T00:00:00.000Z",
  "source": "gantt-service",
  "severity": "warning",
  "payload": {
    "projectId": "project-1",
    "projectName": "Launch",
    "deadline": "2026-05-10T00:00:00.000Z",
    "daysOverdue": 2,
    "channel": "#projects"
  }
}
```

### `project.member.overallocated`

Subject: `notifications.project.member.overallocated`

```json
{
  "eventId": "project-event-2",
  "correlationId": "allocation-check-1",
  "event": "project.member.overallocated",
  "timestamp": "2026-05-12T00:00:00.000Z",
  "source": "gantt-service",
  "severity": "warning",
  "payload": {
    "projectId": "project-1",
    "projectName": "Launch",
    "memberId": "member-1",
    "memberName": "Grace Hopper",
    "allocationPercent": 140,
    "channel": "#projects"
  }
}
```

### `monitoring.employee.afk`

Subject: `notifications.monitoring.employee.afk`

```json
{
  "eventId": "monitoring-event-1",
  "correlationId": "presence-check-1",
  "event": "monitoring.employee.afk",
  "timestamp": "2026-05-12T00:00:00.000Z",
  "source": "monitoring-service",
  "severity": "warning",
  "payload": {
    "employeeId": "employee-1",
    "employeeName": "Ada Lovelace",
    "minutesAfk": 15,
    "channel": "#monitoring"
  }
}
```

`channel` remains an optional payload field for compatibility, but NATS event delivery uses
the notification routing layer to resolve Rocket.Chat channels. See [routing.md](routing.md).
For field usage across routing, templates, and links, see
[event-field-matrix.md](event-field-matrix.md).
