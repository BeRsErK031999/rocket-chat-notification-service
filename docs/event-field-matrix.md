# Event Field Matrix

This matrix audits fields used by notification routing, templates, and links against the
supported event payload schemas.

| event | field | required/optional | used by routing | used by template | used by links | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `project.deadline.overdue` | `projectId` | required | yes | no | yes | Routes project events to project-specific channels and builds project links. |
| `project.deadline.overdue` | `projectName` | required | no | yes | no | Rendered in notification text. |
| `project.deadline.overdue` | `deadline` | required | no | yes | no | Rendered in notification text. |
| `project.deadline.overdue` | `daysOverdue` | required | no | yes | no | Rendered in notification text. |
| `project.deadline.overdue` | `channel` | optional | no | no | no | Preserved for backward compatibility; routing layer ignores it. |
| `project.member.overallocated` | `projectId` | required | yes | no | yes | Routes project events to project-specific channels and builds project links. |
| `project.member.overallocated` | `projectName` | required | no | yes | no | Rendered in notification text. |
| `project.member.overallocated` | `memberId` | required | no | no | no | Contract field reserved for consumers that need member identity. |
| `project.member.overallocated` | `memberName` | required | no | yes | no | Rendered in notification text. |
| `project.member.overallocated` | `allocationPercent` | required | no | yes | no | Rendered in notification text. |
| `project.member.overallocated` | `channel` | optional | no | no | no | Preserved for backward compatibility; routing layer ignores it. |
| `finance.budget.exceeded` | `projectId` | optional | no | no | yes | Optional for backward compatibility; enables finance links when present. |
| `finance.budget.exceeded` | `budgetId` | required | no | no | no | Contract field reserved for budget identity. |
| `finance.budget.exceeded` | `budgetName` | required | no | yes | no | Rendered in notification text. |
| `finance.budget.exceeded` | `actualAmount` | required | no | yes | no | Rendered in notification text. |
| `finance.budget.exceeded` | `limitAmount` | required | no | yes | no | Rendered in notification text. |
| `finance.budget.exceeded` | `currency` | required | no | yes | no | Rendered in notification text. |
| `finance.budget.exceeded` | `channel` | optional | no | no | no | Preserved for backward compatibility; routing layer ignores it. |
| `monitoring.employee.afk` | `employeeId` | required | no | no | yes | Builds employee monitoring links. |
| `monitoring.employee.afk` | `employeeName` | required | no | yes | no | Rendered in notification text. |
| `monitoring.employee.afk` | `minutesAfk` | required | no | yes | no | Rendered in notification text. |
| `monitoring.employee.afk` | `channel` | optional | no | no | no | Preserved for backward compatibility; routing layer ignores it. |

## Audit Result

The only contract mismatch found was `finance.budget.exceeded.payload.projectId`: finance
links need project context, but the strict payload schema previously rejected `projectId`.
The field is now optional, so existing publishers remain compatible and finance links can be
rendered when newer publishers provide project context.
