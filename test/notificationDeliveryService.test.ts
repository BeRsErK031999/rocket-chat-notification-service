import pino from "pino";
import { describe, expect, it, vi } from "vitest";

import type { RocketChatClientPort } from "../src/integrations/rocket-chat/rocketChatTypes.js";
import { NotificationDeliveryService } from "../src/modules/notifications/delivery/notificationDeliveryService.js";
import { createRetryPolicy } from "../src/modules/notifications/delivery/retryPolicy.js";
import { NotificationService } from "../src/modules/notifications/notificationService.js";

const notificationInput = {
  channel: "#finance",
  text: "Budget exceeded",
  metadata: {
    eventId: "event-1",
    correlationId: "correlation-1"
  }
};

const deliveryContext = {
  eventId: "event-1",
  correlationId: "correlation-1"
};

const createNotificationService = (postMessage: RocketChatClientPort["postMessage"]) => {
  const rocketChatClient: RocketChatClientPort = {
    postMessage,
    healthCheck: vi.fn<RocketChatClientPort["healthCheck"]>().mockResolvedValue(true)
  };

  return new NotificationService(rocketChatClient);
};

describe("NotificationDeliveryService", () => {
  it("succeeds on first attempt", async () => {
    const postMessage = vi
      .fn<RocketChatClientPort["postMessage"]>()
      .mockResolvedValue({ ok: true });
    const deliveryService = new NotificationDeliveryService(
      createNotificationService(postMessage),
      createRetryPolicy(3, 0),
      pino({ enabled: false }),
      () => Promise.resolve()
    );

    await expect(deliveryService.deliver(notificationInput, deliveryContext)).resolves.toEqual({
      ok: true
    });
    expect(postMessage).toHaveBeenCalledOnce();
  });

  it("succeeds after retry", async () => {
    const postMessage = vi
      .fn<RocketChatClientPort["postMessage"]>()
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValue({ ok: true });
    const delay = vi.fn<(delayMs: number) => Promise<void>>().mockResolvedValue(undefined);
    const deliveryService = new NotificationDeliveryService(
      createNotificationService(postMessage),
      createRetryPolicy(3, 25),
      pino({ enabled: false }),
      delay
    );

    await expect(deliveryService.deliver(notificationInput, deliveryContext)).resolves.toEqual({
      ok: true
    });
    expect(postMessage).toHaveBeenCalledTimes(2);
    expect(delay).toHaveBeenCalledWith(25);
  });

  it("fails after max attempts", async () => {
    const postMessage = vi
      .fn<RocketChatClientPort["postMessage"]>()
      .mockRejectedValue(new Error("permanent failure"));
    const delay = vi.fn<(delayMs: number) => Promise<void>>().mockResolvedValue(undefined);
    const deliveryService = new NotificationDeliveryService(
      createNotificationService(postMessage),
      createRetryPolicy(3, 25),
      pino({ enabled: false }),
      delay
    );

    await expect(deliveryService.deliver(notificationInput, deliveryContext)).rejects.toThrow(
      "permanent failure"
    );
    expect(postMessage).toHaveBeenCalledTimes(3);
    expect(delay).toHaveBeenCalledTimes(2);
  });
});
