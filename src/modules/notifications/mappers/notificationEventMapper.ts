import type { NotificationEvent } from "../../../events/contracts/index.js";
import type { MappedNotification, SendNotificationInput } from "../notificationTypes.js";
import { renderNotificationTemplate } from "../templates/notificationTemplateRenderer.js";
import type {
  NotificationTemplateInput,
  NotificationTemplateRenderer
} from "../templates/notificationTemplateTypes.js";

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

export const mapNotificationEvent = (event: NotificationEvent): MappedNotification => {
  return createNotificationEventMapper()(event);
};

const templateInputFor = (event: NotificationEvent): NotificationTemplateInput => {
  switch (event.event) {
    case "project.deadline.overdue":
      return {
        event: event.event,
        severity: event.severity ?? "warning",
        data: {
          projectName: event.payload.projectName,
          deadline: event.payload.deadline,
          daysOverdue: event.payload.daysOverdue
        }
      };

    case "project.member.overallocated":
      return {
        event: event.event,
        severity: event.severity ?? "warning",
        data: {
          projectName: event.payload.projectName,
          memberName: event.payload.memberName,
          allocationPercent: event.payload.allocationPercent
        }
      };

    case "finance.budget.exceeded":
      return {
        event: event.event,
        severity: event.severity ?? "critical",
        data: {
          budgetName: event.payload.budgetName,
          actualAmount: event.payload.actualAmount,
          limitAmount: event.payload.limitAmount,
          currency: event.payload.currency
        }
      };

    case "monitoring.employee.afk":
      return {
        event: event.event,
        severity: event.severity ?? "warning",
        data: {
          employeeName: event.payload.employeeName,
          minutesAfk: event.payload.minutesAfk
        }
      };
  }
};

export const createNotificationEventMapper =
  (renderTemplate: NotificationTemplateRenderer = renderNotificationTemplate) =>
  (event: NotificationEvent): MappedNotification => {
    return {
      text: renderTemplate(templateInputFor(event)),
      metadata: metadataFor(event)
    };
  };
