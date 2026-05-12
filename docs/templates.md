# Notification Templates

Notification templates format normalized event data into Rocket.Chat markdown text.

The event mapper prepares:

- normalized template data
- notification metadata

The template renderer prepares:

- the final Rocket.Chat `text`

Routing remains separate and still resolves only the Rocket.Chat channel. Manual
`POST /notifications/send` requests keep their existing behavior and provide `text`
directly.

## Supported templates

- `project.deadline.overdue`
- `project.member.overallocated`
- `finance.budget.exceeded`
- `monitoring.employee.afk`

## Formats

Templates currently render one readable Rocket.Chat markdown format. The renderer API keeps
formatting isolated so future variants such as `short`, `detailed`, or `markdown` can be
added without changing event contracts or routing rules.

## Fallback

The renderer includes a fallback message for unsupported event names:

```text
*[info]* Unsupported notification event: unknown.event.
```

Validated NATS events still use the supported event contracts. The fallback exists for the
template layer and future extension points; it does not change routing or delivery behavior.
