import type { NotificationEvent } from "../../../events/contracts/index.js";
import type { SendNotificationInput } from "../notificationTypes.js";

const metadataFor = (
  event: NotificationEvent
): NonNullable<SendNotificationInput["metadata"]> => ({
  eventId: event.eventId,
  correlationId: event.correlationId ?? null,
  event: event.event,
  timestamp: event.timestamp,
  source: event.source,
  severity: event.severity ?? "info"
});

export const mapNotificationEvent = (event: NotificationEvent): SendNotificationInput => {
  switch (event.event) {
    case "project.deadline.overdue":
      return {
        channel: event.payload.channel ?? "#projects",
        text: `[${event.severity ?? "warning"}] Project "${event.payload.projectName}" is overdue by ${event.payload.daysOverdue} day(s). Deadline: ${event.payload.deadline}.`,
        metadata: metadataFor(event)
      };

    case "project.member.overallocated":
      return {
        channel: event.payload.channel ?? "#projects",
        text: `[${event.severity ?? "warning"}] ${event.payload.memberName} is allocated at ${event.payload.allocationPercent}% on project "${event.payload.projectName}".`,
        metadata: metadataFor(event)
      };

    case "finance.budget.exceeded":
      return {
        channel: event.payload.channel ?? "#finance",
        text: `[${event.severity ?? "critical"}] Budget "${event.payload.budgetName}" exceeded: ${event.payload.actualAmount} ${event.payload.currency} / ${event.payload.limitAmount} ${event.payload.currency}.`,
        metadata: metadataFor(event)
      };

    case "monitoring.employee.afk":
      return {
        channel: event.payload.channel ?? "#monitoring",
        text: `[${event.severity ?? "warning"}] ${event.payload.employeeName} has been AFK for ${event.payload.minutesAfk} minute(s).`,
        metadata: metadataFor(event)
      };
  }
};
