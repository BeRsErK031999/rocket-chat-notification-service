import { describe, expect, it } from "vitest";

import type { NotificationEvent } from "../src/events/contracts/index.js";
import { mapNotificationEvent } from "../src/modules/notifications/mappers/notificationEventMapper.js";

describe("mapNotificationEvent", () => {
  it("maps finance events to Rocket.Chat notifications", () => {
    const event: NotificationEvent = {
      eventId: "event-1",
      correlationId: "correlation-1",
      event: "finance.budget.exceeded",
      timestamp: "2026-05-12T00:00:00.000Z",
      source: "finance-service",
      severity: "critical",
      payload: {
        budgetId: "budget-1",
        budgetName: "Ops",
        actualAmount: 120,
        limitAmount: 100,
        currency: "USD",
        channel: "#finance-alerts"
      }
    };

    expect(mapNotificationEvent(event)).toEqual({
      text: '[critical] Budget "Ops" exceeded: 120 USD / 100 USD.',
      metadata: {
        eventId: "event-1",
        correlationId: "correlation-1",
        event: "finance.budget.exceeded",
        timestamp: "2026-05-12T00:00:00.000Z",
        source: "finance-service",
        severity: "critical"
      }
    });
  });

  it("maps project events without owning channel routing", () => {
    const event: NotificationEvent = {
      eventId: "event-2",
      event: "project.member.overallocated",
      timestamp: "2026-05-12T00:00:00.000Z",
      source: "gantt-service",
      payload: {
        projectId: "project-1",
        projectName: "Launch",
        memberId: "member-1",
        memberName: "Grace",
        allocationPercent: 140
      }
    };

    const notification = mapNotificationEvent(event);

    expect("channel" in notification).toBe(false);
    expect(notification.metadata).toMatchObject({
      eventId: "event-2",
      correlationId: null,
      event: "project.member.overallocated",
      source: "gantt-service",
      severity: "info"
    });
  });
});
