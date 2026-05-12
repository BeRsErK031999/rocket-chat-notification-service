# Notification Routing

Notification event handling is split into two steps:

```text
event -> mapper builds text/metadata -> router resolves channel -> delivery
```

The mapper does not choose Rocket.Chat channels for NATS events. Channel selection is handled
by routing rules.

## Configuration

```text
DEFAULT_NOTIFICATION_CHANNEL=general
FINANCE_ALERTS_CHANNEL=finance-alerts
PROJECT_ALERTS_CHANNEL_PREFIX=project-
MONITORING_ALERTS_CHANNEL=monitoring-alerts
```

## Rules

### `finance.budget.exceeded`

Routes to:

```text
FINANCE_ALERTS_CHANNEL
```

### `monitoring.employee.afk`

Routes to:

```text
MONITORING_ALERTS_CHANNEL
```

### Project Events

Applies to:

- `project.deadline.overdue`
- `project.member.overallocated`

If `payload.projectId` is present, routes to:

```text
${PROJECT_ALERTS_CHANNEL_PREFIX}${projectId}
```

If `payload.projectId` is missing or empty, routes to:

```text
DEFAULT_NOTIFICATION_CHANNEL
```

## Logs

Routing logs include:

- `eventId`
- `event`
- `resolvedChannel`
- `routingRule`

Manual `POST /notifications/send` requests keep their existing behavior and use the `channel`
provided in the request body.
