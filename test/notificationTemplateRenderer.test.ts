import { describe, expect, it } from "vitest";

import { renderNotificationTemplate } from "../src/modules/notifications/templates/notificationTemplateRenderer.js";

describe("renderNotificationTemplate", () => {
  it("renders finance budget exceeded", () => {
    expect(
      renderNotificationTemplate({
        event: "finance.budget.exceeded",
        severity: "critical",
        data: {
          budgetName: "Ops",
          actualAmount: 120,
          limitAmount: 100,
          currency: "USD"
        }
      })
    ).toBe('*[critical]* Budget "Ops" exceeded: 120 USD / 100 USD.');
  });

  it("renders project deadline overdue", () => {
    expect(
      renderNotificationTemplate({
        event: "project.deadline.overdue",
        severity: "warning",
        data: {
          projectName: "Launch",
          deadline: "2026-05-10T00:00:00.000Z",
          daysOverdue: 2
        }
      })
    ).toBe('*[warning]* Project "Launch" is overdue by 2 day(s). Deadline: 2026-05-10T00:00:00.000Z.');
  });

  it("renders monitoring employee afk", () => {
    expect(
      renderNotificationTemplate({
        event: "monitoring.employee.afk",
        severity: "warning",
        data: {
          employeeName: "Ada",
          minutesAfk: 15
        }
      })
    ).toBe("*[warning]* Ada has been AFK for 15 minute(s).");
  });

  it("renders fallback for unsupported events", () => {
    expect(
      renderNotificationTemplate({
        event: "unknown.event",
        severity: "info",
        data: {}
      })
    ).toBe("*[info]* Unsupported notification event: unknown.event.");
  });
});
