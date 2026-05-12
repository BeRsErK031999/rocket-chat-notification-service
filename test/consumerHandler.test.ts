import pino from "pino";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleIncomingEvent } from "../src/events/consumers/consumerHandler.js";
import type { NotificationEvent } from "../src/events/contracts/index.js";
import { InMemoryIdempotencyStore } from "../src/events/idempotency/inMemoryIdempotencyStore.js";
import type { IdempotencyStore } from "../src/events/idempotency/idempotencyStore.js";
import type { NotificationDeliveryPort } from "../src/modules/notifications/delivery/notificationDeliveryService.js";
import type { NotificationRouter } from "../src/modules/notifications/routing/routingTypes.js";
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

  const createStore = (): IdempotencyStore => new InMemoryIdempotencyStore(86400000);
  const createRouter = (): NotificationRouter => ({
    resolve: () => ({
      channel: "finance-alerts",
      routingRule: "test-rule"
    })
  });

  it("returns validation_failed for invalid events", async () => {
    const deliver = vi.fn<NotificationDeliveryPort["deliver"]>().mockResolvedValue({ ok: true });
    const deliveryService: NotificationDeliveryPort = {
      deliver
    };
    const idempotencyStore = createStore();

    const result = await handleIncomingEvent({
      subject: "notifications.finance.budget.exceeded",
      data: {
        event: "finance.budget.exceeded",
        timestamp: "2026-05-12T00:00:00.000Z",
        source: "finance-service",
        payload: {}
      },
      notificationDeliveryService: deliveryService,
      idempotencyStore,
      notificationRouter: createRouter(),
      logger: pino({ enabled: false })
    });

    expect(result).toEqual({ status: "validation_failed" });
    expect(deliver).not.toHaveBeenCalled();
    expect(idempotencyStore.has("event-1")).toBe(false);
    expect(metricsRegistry.render()).toContain(
      'events_processed_total{event="finance.budget.exceeded",result="validation_failed"} 1'
    );
  });

  it("returns success when delivery succeeds", async () => {
    const deliver = vi.fn<NotificationDeliveryPort["deliver"]>().mockResolvedValue({ ok: true });
    const deliveryService: NotificationDeliveryPort = {
      deliver
    };
    const idempotencyStore = createStore();

    const result = await handleIncomingEvent({
      subject: "notifications.finance.budget.exceeded",
      data: validFinanceEvent,
      notificationDeliveryService: deliveryService,
      idempotencyStore,
      notificationRouter: createRouter(),
      logger: pino({ enabled: false })
    });

    expect(result).toEqual({
      status: "success",
      eventId: "event-1",
      correlationId: "correlation-1"
    });
    expect(deliver).toHaveBeenCalledOnce();
    expect(idempotencyStore.has("event-1")).toBe(true);
    expect(metricsRegistry.render()).toContain(
      'events_processed_total{event="finance.budget.exceeded",result="success"} 1'
    );
  });

  it("skips duplicate events without delivery", async () => {
    const deliver = vi.fn<NotificationDeliveryPort["deliver"]>().mockResolvedValue({ ok: true });
    const deliveryService: NotificationDeliveryPort = {
      deliver
    };
    const idempotencyStore = createStore();
    idempotencyStore.record("event-1");

    const result = await handleIncomingEvent({
      subject: "notifications.finance.budget.exceeded",
      data: validFinanceEvent,
      notificationDeliveryService: deliveryService,
      idempotencyStore,
      notificationRouter: createRouter(),
      logger: pino({ enabled: false })
    });

    expect(result).toEqual({
      status: "duplicate_skipped",
      eventId: "event-1",
      correlationId: "correlation-1"
    });
    expect(deliver).not.toHaveBeenCalled();
    expect(metricsRegistry.render()).toContain(
      'events_processed_total{event="finance.budget.exceeded",result="duplicate_skipped"} 1'
    );
  });

  it("returns delivery_failed when delivery exhausts retries", async () => {
    const idempotencyStore = createStore();
    const deliveryService: NotificationDeliveryPort = {
      deliver: vi
        .fn<NotificationDeliveryPort["deliver"]>()
        .mockRejectedValue(new Error("Rocket.Chat unavailable"))
    };

    const result = await handleIncomingEvent({
      subject: "notifications.finance.budget.exceeded",
      data: validFinanceEvent,
      notificationDeliveryService: deliveryService,
      idempotencyStore,
      notificationRouter: createRouter(),
      logger: pino({ enabled: false })
    });

    expect(result).toEqual({
      status: "delivery_failed",
      eventId: "event-1",
      correlationId: "correlation-1"
    });
    expect(idempotencyStore.has("event-1")).toBe(false);
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
      idempotencyStore: createStore(),
      notificationRouter: createRouter(),
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
