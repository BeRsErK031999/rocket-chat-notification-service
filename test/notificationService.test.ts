import { describe, expect, it, vi } from "vitest";

import type { RocketChatClientPort } from "../src/integrations/rocket-chat/rocketChatTypes.js";
import { NotificationService } from "../src/modules/notifications/notificationService.js";

describe("NotificationService", () => {
  it("sends a message through RocketChatClient", async () => {
    const rocketChatClient = {
      postMessage: vi.fn<RocketChatClientPort["postMessage"]>().mockResolvedValue({ ok: true }),
      healthCheck: vi.fn<RocketChatClientPort["healthCheck"]>().mockResolvedValue(true),
      channelExists: vi.fn<RocketChatClientPort["channelExists"]>().mockResolvedValue(true)
    };
    const service = new NotificationService(rocketChatClient);

    const result = await service.send({
      channel: "#finance",
      text: "Payment deadline changed"
    });

    expect(result).toEqual({ ok: true });
    expect(rocketChatClient.postMessage).toHaveBeenCalledWith({
      channel: "#finance",
      text: "Payment deadline changed"
    });
  });

  it("checks channel existence through RocketChatClient", async () => {
    const channelExists = vi
      .fn<RocketChatClientPort["channelExists"]>()
      .mockResolvedValue(true);
    const rocketChatClient: RocketChatClientPort = {
      postMessage: vi.fn<RocketChatClientPort["postMessage"]>().mockResolvedValue({ ok: true }),
      healthCheck: vi.fn<RocketChatClientPort["healthCheck"]>().mockResolvedValue(true),
      channelExists
    };
    const service = new NotificationService(rocketChatClient);

    await expect(service.channelExists("#finance")).resolves.toBe(true);
    expect(channelExists).toHaveBeenCalledWith("#finance");
  });
});
