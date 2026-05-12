import type { RocketChatClientPort } from "../../integrations/rocket-chat/rocketChatTypes.js";
import type { SendNotificationInput, SendNotificationResult } from "./notificationTypes.js";

export class NotificationService {
  constructor(private readonly rocketChatClient: RocketChatClientPort) {}

  async channelExists(channel: string): Promise<boolean> {
    return this.rocketChatClient.channelExists(channel);
  }

  async send(input: SendNotificationInput): Promise<SendNotificationResult> {
    await this.rocketChatClient.postMessage({
      channel: input.channel,
      text: input.text
    });

    return { ok: true };
  }
}
