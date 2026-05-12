import pino from "pino";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleIncomingEvent } from "../src/events/consumers/consumerHandler.js";
import type { NotificationEvent } from "../src/events/contracts/index.js";
import type { NotificationDeliveryPort } from "../src/modules/notifications/delivery/notificationDeliveryService.js";
import { metricsRegistry } from "../src/observability/metrics.js";

const validFinanceEvent: NotificationEvent = {
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
    currency: "USD"
  }
};

describe("handleIncomingEvent", () => {
  beforeEach(() => {
    metricsRegistry.reset();
  });

  it("returns validation_failed for invalid events", async () => {
    const deliver = vi.fn<NotificationDeliveryPort["deliver"]>().mockResolvedValue({ ok: true });
    const deliveryService: NotificationDeliveryPort = {
      deliver
    };

    const result = await handleIncomingEvent({
      subject: "notifications.finance.budget.exceeded",
      data: {
        event: "finance.budget.exceeded",
        timestamp: "2026-05-12T00:00:00.000Z",
        source: "finance-service",
        payload: {}
      },
      notificationDeliveryService: deliveryService,
      logger: pino({ enabled: false })
    });

    expect(result).toEqual({ status: "validation_failed" });
    expect(deliver).not.toHaveBeenCalled();
    expect(metricsRegistry.render()).toContain(
      'events_processed_total{event="finance.budget.exceeded",result="validation_failed"} 1'
    );
  });

  it("returns success when delivery succeeds", async () => {
    const deliver = vi.fn<NotificationDeliveryPort["deliver"]>().mockResolvedValue({ ok: true });
    const deliveryService: NotificationDeliveryPort = {
      deliver
    };

    const result = await handleIncomingEvent({
      subject: "notifications.finance.budget.exceeded",
      data: validFinanceEvent,
      notificationDeliveryService: deliveryService,
      logger: pino({ enabled: false })
    });

    expect(result).toEqual({
      status: "success",
      eventId: "event-1",
      correlationId: "correlation-1"
    });
    expect(deliver).toHaveBeenCalledOnce();
    expect(metricsRegistry.render()).toContain(
      'events_processed_total{event="finance.budget.exceeded",result="success"} 1'
    );
  });

  it("returns delivery_failed when delivery exhausts retries", async () => {
    const deliveryService: NotificationDeliveryPort = {
      deliver: vi
        .fn<NotificationDeliveryPort["deliver"]>()
        .mockRejectedValue(new Error("Rocket.Chat unavailable"))
    };

    const result = await handleIncomingEvent({
      subject: "notifications.finance.budget.exceeded",
      data: validFinanceEvent,
      notificationDeliveryService: deliveryService,
      logger: pino({ enabled: false })
    });

    expect(result).toEqual({
      status: "delivery_failed",
      eventId: "event-1",
      correlationId: "correlation-1"
    });
  });

  it("does not deliver when mapping fails", async () => {
    const deliver = vi.fn<NotificationDeliveryPort["deliver"]>().mockResolvedValue({ ok: true });
    const deliveryService: NotificationDeliveryPort = {
      deliver
    };

    const result = await handleIncomingEvent({
      subject: "notifications.finance.budget.exceeded",
      data: validFinanceEvent,
      notificationDeliveryService: deliveryService,
      logger: pino({ enabled: false }),
      mapEvent: () => {
        throw new Error("mapping failed");
      }
    });

    expect(result).toEqual({
      status: "mapping_failed",
      eventId: "event-1",
      correlationId: "correlation-1"
    });
    expect(deliver).not.toHaveBeenCalled();
  });
});
