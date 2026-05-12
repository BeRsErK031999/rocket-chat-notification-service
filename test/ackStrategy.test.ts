import pino from "pino";
import { describe, expect, it, vi } from "vitest";

import { processJetStreamMessage } from "../src/events/eventBus/ackStrategy.js";

const logger = pino({ enabled: false });

describe("processJetStreamMessage", () => {
  it("acks successful events without publishing to DLQ", async () => {
    const ack = vi.fn<() => void>();
    const publishDlq = vi.fn<(subject: string, payload: unknown) => Promise<void>>();

    const result = await processJetStreamMessage({
      message: {
        subject: "notifications.finance.budget.exceeded",
        data: { eventId: "event-1" },
        ack
      },
      dlqSubject: "notifications.dlq",
      logger,
      handleEvent: () => Promise.resolve({ status: "success", eventId: "event-1" }),
      publishDlq
    });

    expect(result).toEqual({ status: "success", eventId: "event-1" });
    expect(publishDlq).not.toHaveBeenCalled();
    expect(ack).toHaveBeenCalledOnce();
  });

  it("acks validation failures without publishing to DLQ", async () => {
    const ack = vi.fn<() => void>();
    const publishDlq = vi.fn<(subject: string, payload: unknown) => Promise<void>>();

    const result = await processJetStreamMessage({
      message: {
        subject: "notifications.finance.budget.exceeded",
        data: { event: "finance.budget.exceeded" },
        ack
      },
      dlqSubject: "notifications.dlq",
      logger,
      handleEvent: () => Promise.resolve({ status: "validation_failed" }),
      publishDlq
    });

    expect(result).toEqual({ status: "validation_failed" });
    expect(publishDlq).not.toHaveBeenCalled();
    expect(ack).toHaveBeenCalledOnce();
  });

  it("acks mapping failures without publishing to DLQ", async () => {
    const ack = vi.fn<() => void>();
    const publishDlq = vi.fn<(subject: string, payload: unknown) => Promise<void>>();

    const result = await processJetStreamMessage({
      message: {
        subject: "notifications.finance.budget.exceeded",
        data: { eventId: "event-1" },
        ack
      },
      dlqSubject: "notifications.dlq",
      logger,
      handleEvent: () => Promise.resolve({ status: "mapping_failed", eventId: "event-1" }),
      publishDlq
    });

    expect(result).toEqual({ status: "mapping_failed", eventId: "event-1" });
    expect(publishDlq).not.toHaveBeenCalled();
    expect(ack).toHaveBeenCalledOnce();
  });

  it("publishes delivery failures to DLQ and acks the original message", async () => {
    const ack = vi.fn<() => void>();
    const publishDlq = vi
      .fn<(subject: string, payload: unknown) => Promise<void>>()
      .mockResolvedValue(undefined);
    const originalPayload = {
      eventId: "event-1",
      correlationId: "correlation-1",
      event: "finance.budget.exceeded",
      source: "finance-service",
      severity: "critical"
    };

    const result = await processJetStreamMessage({
      message: {
        subject: "notifications.finance.budget.exceeded",
        data: originalPayload,
        ack
      },
      dlqSubject: "notifications.dlq",
      logger,
      handleEvent: () =>
        Promise.resolve({
          status: "delivery_failed",
          eventId: "event-1",
          correlationId: "correlation-1"
        }),
      publishDlq
    });

    expect(result).toEqual({
      status: "delivery_failed",
      eventId: "event-1",
      correlationId: "correlation-1"
    });
    expect(publishDlq).toHaveBeenCalledWith(
      "notifications.dlq",
      expect.objectContaining({
        originalSubject: "notifications.finance.budget.exceeded",
        eventId: "event-1",
        correlationId: "correlation-1",
        event: "finance.budget.exceeded",
        source: "finance-service",
        severity: "critical",
        failureReason: "delivery_failed",
        originalPayload
      })
    );
    expect(ack).toHaveBeenCalledOnce();
  });
});
