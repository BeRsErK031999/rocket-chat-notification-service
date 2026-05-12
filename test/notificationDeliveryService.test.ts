import pino from "pino";
import { describe, expect, it, vi } from "vitest";

import type { RocketChatClientPort } from "../src/integrations/rocket-chat/rocketChatTypes.js";
import {
  MissingNotificationChannelError,
  NotificationDeliveryService
} from "../src/modules/notifications/delivery/notificationDeliveryService.js";
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

const createNotificationService = (
  postMessage: RocketChatClientPort["postMessage"],
  channelExists: RocketChatClientPort["channelExists"] = vi
    .fn<RocketChatClientPort["channelExists"]>()
    .mockResolvedValue(true)
) => {
  const rocketChatClient: RocketChatClientPort = {
    postMessage,
    healthCheck: vi.fn<RocketChatClientPort["healthCheck"]>().mockResolvedValue(true),
    channelExists
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
      false,
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
      false,
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
      false,
      delay
    );

    await expect(deliveryService.deliver(notificationInput, deliveryContext)).rejects.toThrow(
      "permanent failure"
    );
    expect(postMessage).toHaveBeenCalledTimes(3);
    expect(delay).toHaveBeenCalledTimes(2);
  });

  it("does not call channel lookup when check is disabled", async () => {
    const postMessage = vi
      .fn<RocketChatClientPort["postMessage"]>()
      .mockResolvedValue({ ok: true });
    const channelExists = vi
      .fn<RocketChatClientPort["channelExists"]>()
      .mockResolvedValue(true);
    const deliveryService = new NotificationDeliveryService(
      createNotificationService(postMessage, channelExists),
      createRetryPolicy(3, 0),
      pino({ enabled: false }),
      false,
      () => Promise.resolve()
    );

    await expect(deliveryService.deliver(notificationInput, deliveryContext)).resolves.toEqual({
      ok: true
    });
    expect(channelExists).not.toHaveBeenCalled();
    expect(postMessage).toHaveBeenCalledOnce();
  });

  it("sends notification when channel check is enabled and channel exists", async () => {
    const postMessage = vi
      .fn<RocketChatClientPort["postMessage"]>()
      .mockResolvedValue({ ok: true });
    const channelExists = vi
      .fn<RocketChatClientPort["channelExists"]>()
      .mockResolvedValue(true);
    const deliveryService = new NotificationDeliveryService(
      createNotificationService(postMessage, channelExists),
      createRetryPolicy(3, 0),
      pino({ enabled: false }),
      true,
      () => Promise.resolve()
    );

    await expect(deliveryService.deliver(notificationInput, deliveryContext)).resolves.toEqual({
      ok: true
    });
    expect(channelExists).toHaveBeenCalledWith("#finance");
    expect(postMessage).toHaveBeenCalledOnce();
  });

  it("fails delivery when channel check is enabled and channel is missing", async () => {
    const postMessage = vi
      .fn<RocketChatClientPort["postMessage"]>()
      .mockResolvedValue({ ok: true });
    const channelExists = vi
      .fn<RocketChatClientPort["channelExists"]>()
      .mockResolvedValue(false);
    const deliveryService = new NotificationDeliveryService(
      createNotificationService(postMessage, channelExists),
      createRetryPolicy(3, 0),
      pino({ enabled: false }),
      true,
      () => Promise.resolve()
    );

    await expect(deliveryService.deliver(notificationInput, deliveryContext)).rejects.toThrow(
      MissingNotificationChannelError
    );
    expect(postMessage).not.toHaveBeenCalled();
  });

  it("does not retry missing channels", async () => {
    const postMessage = vi
      .fn<RocketChatClientPort["postMessage"]>()
      .mockResolvedValue({ ok: true });
    const channelExists = vi
      .fn<RocketChatClientPort["channelExists"]>()
      .mockResolvedValue(false);
    const delay = vi.fn<(delayMs: number) => Promise<void>>().mockResolvedValue(undefined);
    const deliveryService = new NotificationDeliveryService(
      createNotificationService(postMessage, channelExists),
      createRetryPolicy(3, 25),
      pino({ enabled: false }),
      true,
      delay
    );

    await expect(deliveryService.deliver(notificationInput, deliveryContext)).rejects.toThrow(
      "Rocket.Chat channel does not exist: #finance"
    );
    expect(channelExists).toHaveBeenCalledOnce();
    expect(postMessage).not.toHaveBeenCalled();
    expect(delay).not.toHaveBeenCalled();
  });
});
