import type { NotificationEvent } from "../../../events/contracts/index.js";
import type { RoutingConfig, RoutingResult } from "./routingTypes.js";

const getProjectId = (event: NotificationEvent): string | undefined => {
  if (
    event.event !== "project.deadline.overdue" &&
    event.event !== "project.member.overallocated"
  ) {
    return undefined;
  }

  return event.payload.projectId.length > 0 ? event.payload.projectId : undefined;
};

export const resolveNotificationRoute = (
  event: NotificationEvent,
  config: RoutingConfig
): RoutingResult => {
  switch (event.event) {
    case "finance.budget.exceeded":
      return {
        channel: config.financeAlertsChannel,
        routingRule: "finance-alerts-channel"
      };

    case "monitoring.employee.afk":
      return {
        channel: config.monitoringAlertsChannel,
        routingRule: "monitoring-alerts-channel"
      };

    case "project.deadline.overdue":
    case "project.member.overallocated": {
      const projectId = getProjectId(event);

      if (projectId !== undefined) {
        return {
          channel: `${config.projectAlertsChannelPrefix}${projectId}`,
          routingRule: "project-specific-channel"
        };
      }

      return {
        channel: config.defaultNotificationChannel,
        routingRule: "default-notification-channel"
      };
    }
  }
};
