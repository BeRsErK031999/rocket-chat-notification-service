import { describe, expect, it, vi } from "vitest";

import type { RocketChatClientPort } from "../src/integrations/rocket-chat/rocketChatTypes.js";
import { NotificationService } from "../src/modules/notifications/notificationService.js";

describe("NotificationService", () => {
  it("sends a message through RocketChatClient", async () => {
    const rocketChatClient = {
      postMessage: vi.fn<RocketChatClientPort["postMessage"]>().mockResolvedValue({ ok: true }),
      healthCheck: vi.fn<RocketChatClientPort["healthCheck"]>().mockResolvedValue(true)
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
});
