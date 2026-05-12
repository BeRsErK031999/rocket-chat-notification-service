import { describe, expect, it } from "vitest";

import { eventContractSchema } from "../src/events/contracts/index.js";

describe("event contracts", () => {
  it("validates a supported finance event", () => {
    const result = eventContractSchema.safeParse({
      eventId: "event-1",
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
    });

    expect(result.success).toBe(true);
  });

  it("validates a finance event with optional projectId", () => {
    const result = eventContractSchema.safeParse({
      eventId: "event-1",
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
    });

    expect(result.success).toBe(true);
  });

  it("rejects unsupported events", () => {
    const result = eventContractSchema.safeParse({
      eventId: "event-1",
      event: "finance.invoice.created",
      timestamp: "2026-05-12T00:00:00.000Z",
      source: "finance-service",
      payload: {}
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid payloads", () => {
    const result = eventContractSchema.safeParse({
      eventId: "event-1",
      event: "monitoring.employee.afk",
      timestamp: "2026-05-12T00:00:00.000Z",
      source: "monitoring-service",
      severity: "warning",
      payload: {
        employeeId: "employee-1",
        employeeName: "Ada",
        minutesAfk: 0
      }
    });

    expect(result.success).toBe(false);
  });

  it("requires eventId", () => {
    const result = eventContractSchema.safeParse({
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
    });

    expect(result.success).toBe(false);
  });
});
