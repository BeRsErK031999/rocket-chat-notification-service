import type { NotificationEvent } from "../../../events/contracts/index.js";

export type RoutingConfig = {
  defaultNotificationChannel: string;
  financeAlertsChannel: string;
  projectAlertsChannelPrefix: string;
  monitoringAlertsChannel: string;
};

export type RoutingResult = {
  channel: string;
  routingRule: string;
};

export type NotificationRouter = {
  resolve(event: NotificationEvent): RoutingResult;
};
