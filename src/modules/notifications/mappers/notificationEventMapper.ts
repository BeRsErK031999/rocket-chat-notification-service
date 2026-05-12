import type { NotificationEvent } from "../../../events/contracts/index.js";
import type { MappedNotification, SendNotificationInput } from "../notificationTypes.js";
import {
  buildNotificationLinks,
  notificationLinkConfigFromEnv
} from "../links/notificationLinks.js";
import type { NotificationLinkConfig, NotificationLinkData } from "../links/linkTypes.js";
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

const templateInputFor = (
  event: NotificationEvent,
  linkConfig: NotificationLinkConfig
): NotificationTemplateInput => {
  switch (event.event) {
    case "project.deadline.overdue": {
      const linkData: NotificationLinkData = {
        projectId: event.payload.projectId
      };

      return {
        event: event.event,
        severity: event.severity ?? "warning",
        data: {
          projectId: event.payload.projectId,
          projectName: event.payload.projectName,
          deadline: event.payload.deadline,
          daysOverdue: event.payload.daysOverdue
        },
        links: buildNotificationLinks(linkData, linkConfig)
      };
    }

    case "project.member.overallocated": {
      const linkData: NotificationLinkData = {
        projectId: event.payload.projectId
      };

      return {
        event: event.event,
        severity: event.severity ?? "warning",
        data: {
          projectId: event.payload.projectId,
          projectName: event.payload.projectName,
          memberName: event.payload.memberName,
          allocationPercent: event.payload.allocationPercent
        },
        links: buildNotificationLinks(linkData, linkConfig)
      };
    }

    case "finance.budget.exceeded": {
      const linkData: NotificationLinkData =
        event.payload.projectId === undefined
          ? {}
          : {
              projectId: event.payload.projectId
            };

      return {
        event: event.event,
        severity: event.severity ?? "critical",
        data: {
          ...(event.payload.projectId === undefined ? {} : { projectId: event.payload.projectId }),
          budgetName: event.payload.budgetName,
          actualAmount: event.payload.actualAmount,
          limitAmount: event.payload.limitAmount,
          currency: event.payload.currency
        },
        links: buildNotificationLinks(linkData, linkConfig)
      };
    }

    case "monitoring.employee.afk": {
      const linkData: NotificationLinkData = {
        employeeId: event.payload.employeeId
      };

      return {
        event: event.event,
        severity: event.severity ?? "warning",
        data: {
          employeeId: event.payload.employeeId,
          employeeName: event.payload.employeeName,
          minutesAfk: event.payload.minutesAfk
        },
        links: buildNotificationLinks(linkData, linkConfig)
      };
    }
  }
};

export const createNotificationEventMapper =
  (
    renderTemplate: NotificationTemplateRenderer = renderNotificationTemplate,
    linkConfig: NotificationLinkConfig = notificationLinkConfigFromEnv()
  ) =>
  (event: NotificationEvent): MappedNotification => {
    return {
      text: renderTemplate(templateInputFor(event, linkConfig)),
      metadata: metadataFor(event)
    };
  };
