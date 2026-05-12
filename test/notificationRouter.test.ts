import { describe, expect, it } from "vitest";

import type { NotificationEvent } from "../src/events/contracts/index.js";
import { RuleBasedNotificationRouter } from "../src/modules/notifications/routing/notificationRouter.js";

const router = new RuleBasedNotificationRouter({
  defaultNotificationChannel: "general",
  financeAlertsChannel: "finance-alerts",
  projectAlertsChannelPrefix: "project-",
  monitoringAlertsChannel: "monitoring-alerts"
});

describe("RuleBasedNotificationRouter", () => {
  it("routes finance events to finance channel", () => {
    const event: NotificationEvent = {
      eventId: "event-1",
      event: "finance.budget.exceeded",
      timestamp: "2026-05-12T00:00:00.000Z",
      source: "finance-service",
      payload: {
        budgetId: "budget-1",
        budgetName: "Ops",
        actualAmount: 120,
        limitAmount: 100,
        currency: "USD"
      }
    };

    expect(router.resolve(event)).toEqual({
      channel: "finance-alerts",
      routingRule: "finance-alerts-channel"
    });
  });

  it("routes monitoring events to monitoring channel", () => {
    const event: NotificationEvent = {
      eventId: "event-2",
      event: "monitoring.employee.afk",
      timestamp: "2026-05-12T00:00:00.000Z",
      source: "monitoring-service",
      payload: {
        employeeId: "employee-1",
        employeeName: "Ada",
        minutesAfk: 15
      }
    };

    expect(router.resolve(event)).toEqual({
      channel: "monitoring-alerts",
      routingRule: "monitoring-alerts-channel"
    });
  });

  it("routes project events to project-specific channel", () => {
    const event: NotificationEvent = {
      eventId: "event-3",
      event: "project.deadline.overdue",
      timestamp: "2026-05-12T00:00:00.000Z",
      source: "gantt-service",
      payload: {
        projectId: "alpha",
        projectName: "Alpha",
        deadline: "2026-05-10T00:00:00.000Z",
        daysOverdue: 2
      }
    };

    expect(router.resolve(event)).toEqual({
      channel: "project-alpha",
      routingRule: "project-specific-channel"
    });
  });

  it("falls back to default channel when project id is missing", () => {
    const event = {
      eventId: "event-4",
      event: "project.member.overallocated",
      timestamp: "2026-05-12T00:00:00.000Z",
      source: "gantt-service",
      payload: {
        projectId: "",
        projectName: "Alpha",
        memberId: "member-1",
        memberName: "Grace",
        allocationPercent: 140
      }
    } as unknown as NotificationEvent;

    expect(router.resolve(event)).toEqual({
      channel: "general",
      routingRule: "default-notification-channel"
    });
  });
});
