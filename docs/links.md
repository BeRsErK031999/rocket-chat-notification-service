# Notification Links

Notification links enrich template output with Rocket.Chat markdown links to internal app
pages.

Links are controlled by:

```text
APP_BASE_URL=
PROJECT_PAGE_PATH_TEMPLATE=/projects/:projectId
FINANCE_PAGE_PATH_TEMPLATE=/projects/:projectId/finance
MONITORING_PAGE_PATH_TEMPLATE=/monitoring/employees/:employeeId
```

If `APP_BASE_URL` is empty, no links are rendered.

## Link Rules

Project events render an `Open project` link when `projectId` is present:

```text
[Open project](https://app.example.test/projects/project-1)
```

Finance events render an `Open finance` link when `projectId` is available to the template:

```text
[Open finance](https://app.example.test/projects/project-1/finance)
```

The current `finance.budget.exceeded` event contract does not include `projectId`, so valid
finance events do not render this link unless the contract is extended in the future.

Monitoring events render an `Open monitoring` link when `employeeId` is present:

```text
[Open monitoring](https://app.example.test/monitoring/employees/employee-1)
```

## Safety

Path parameters are URL-encoded before they are inserted into path templates. If the base URL
is empty or cannot be used to build a URL, the renderer receives no link and the message text
is rendered without a broken markdown link.
