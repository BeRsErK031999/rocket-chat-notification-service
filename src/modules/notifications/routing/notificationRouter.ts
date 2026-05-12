import type { NotificationEvent } from "../../../events/contracts/index.js";
import { resolveNotificationRoute } from "./routingRules.js";
import type { NotificationRouter, RoutingConfig, RoutingResult } from "./routingTypes.js";

export class RuleBasedNotificationRouter implements NotificationRouter {
  constructor(private readonly config: RoutingConfig) {}

  resolve(event: NotificationEvent): RoutingResult {
    return resolveNotificationRoute(event, this.config);
  }
}
