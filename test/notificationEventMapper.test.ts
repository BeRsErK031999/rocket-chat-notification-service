import { describe, expect, it } from "vitest";

import type { NotificationEvent } from "../src/events/contracts/index.js";
import {
  createNotificationEventMapper,
  mapNotificationEvent
} from "../src/modules/notifications/mappers/notificationEventMapper.js";
import type { NotificationLinkConfig } from "../src/modules/notifications/links/linkTypes.js";
import type { NotificationTemplateInput } from "../src/modules/notifications/templates/notificationTemplateTypes.js";

const linkConfig: NotificationLinkConfig = {
  appBaseUrl: "https://app.example.test",
  projectPagePathTemplate: "/projects/:projectId",
  financePagePathTemplate: "/projects/:projectId/finance",
  monitoringPagePathTemplate: "/monitoring/employees/:employeeId"
};

const emptyBaseUrlLinkConfig: NotificationLinkConfig = {
  ...linkConfig,
  appBaseUrl: ""
};

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
      text: '*[critical]* Budget "Ops" exceeded: 120 USD / 100 USD.',
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

  it("uses the template renderer for notification text", () => {
    const renderedInputs: NotificationTemplateInput[] = [];
    const mapEvent = createNotificationEventMapper((input) => {
      renderedInputs.push(input);
      return "rendered notification";
    });
    const event: NotificationEvent = {
      eventId: "event-3",
      event: "monitoring.employee.afk",
      timestamp: "2026-05-12T00:00:00.000Z",
      source: "monitoring-service",
      payload: {
        employeeId: "employee-1",
        employeeName: "Ada",
        minutesAfk: 15
      }
    };

    expect(mapEvent(event).text).toBe("rendered notification");
    expect(renderedInputs).toEqual([
      {
        event: "monitoring.employee.afk",
        severity: "warning",
        data: {
          employeeId: "employee-1",
          employeeName: "Ada",
          minutesAfk: 15
        },
        links: {}
      }
    ]);
  });

  it("does not render links when APP_BASE_URL is empty", () => {
    const mapEvent = createNotificationEventMapper(undefined, emptyBaseUrlLinkConfig);
    const event: NotificationEvent = {
      eventId: "event-4",
      event: "project.deadline.overdue",
      timestamp: "2026-05-12T00:00:00.000Z",
      source: "gantt-service",
      payload: {
        projectId: "project-1",
        projectName: "Launch",
        deadline: "2026-05-10T00:00:00.000Z",
        daysOverdue: 2
      }
    };

    expect(mapEvent(event).text).toBe(
      '*[warning]* Project "Launch" is overdue by 2 day(s). Deadline: 2026-05-10T00:00:00.000Z.'
    );
  });

  it("renders project link when projectId exists", () => {
    const mapEvent = createNotificationEventMapper(undefined, linkConfig);
    const event: NotificationEvent = {
      eventId: "event-5",
      event: "project.deadline.overdue",
      timestamp: "2026-05-12T00:00:00.000Z",
      source: "gantt-service",
      payload: {
        projectId: "project-1",
        projectName: "Launch",
        deadline: "2026-05-10T00:00:00.000Z",
        daysOverdue: 2
      }
    };

    expect(mapEvent(event).text).toContain(
      "[Open project](https://app.example.test/projects/project-1)"
    );
  });

  it("renders finance link when projectId exists", () => {
    const mapEvent = createNotificationEventMapper(undefined, linkConfig);
    const event: NotificationEvent = {
      eventId: "event-6",
      event: "finance.budget.exceeded",
      timestamp: "2026-05-12T00:00:00.000Z",
      source: "finance-service",
      severity: "critical",
      payload: {
        projectId: "project-1",
        budgetId: "budget-1",
        budgetName: "Ops",
        actualAmount: 120,
        limitAmount: 100,
        currency: "USD"
      }
    };

    expect(mapEvent(event).text).toContain(
      "[Open finance](https://app.example.test/projects/project-1/finance)"
    );
  });

  it("valid finance events without projectId render without finance link", () => {
    const mapEvent = createNotificationEventMapper(undefined, linkConfig);
    const event: NotificationEvent = {
      eventId: "event-6-without-project",
      event: "finance.budget.exceeded",
      timestamp: "2026-05-12T00:00:00.000Z",
      source: "finance-service",
      severity: "critical",
      payload: {
        budgetId: "budget-1",
        budgetName: "Ops",
        actualAmount: 120,
        limitAmount: 100,
        currency: "USD"
      }
    };

    expect(mapEvent(event).text).toBe('*[critical]* Budget "Ops" exceeded: 120 USD / 100 USD.');
  });

  it("renders monitoring link when employeeId exists", () => {
    const mapEvent = createNotificationEventMapper(undefined, linkConfig);
    const event: NotificationEvent = {
      eventId: "event-7",
      event: "monitoring.employee.afk",
      timestamp: "2026-05-12T00:00:00.000Z",
      source: "monitoring-service",
      payload: {
        employeeId: "employee-1",
        employeeName: "Ada",
        minutesAfk: 15
      }
    };

    expect(mapEvent(event).text).toContain(
      "[Open monitoring](https://app.example.test/monitoring/employees/employee-1)"
    );
  });

  it("does not render a broken link when required id is missing", () => {
    const mapEvent = createNotificationEventMapper(undefined, linkConfig);
    const event = {
      eventId: "event-8",
      event: "monitoring.employee.afk",
      timestamp: "2026-05-12T00:00:00.000Z",
      source: "monitoring-service",
      payload: {
        employeeId: "",
        employeeName: "Ada",
        minutesAfk: 15
      }
    } as unknown as NotificationEvent;

    expect(mapEvent(event).text).toBe("*[warning]* Ada has been AFK for 15 minute(s).");
  });
});
