import { ExternalServiceError } from "../../shared/errors.js";
import { metrics } from "../../observability/metrics.js";
import type {
  RocketChatClientPort,
  RocketChatPostMessagePayload,
  RocketChatPostMessageResult
} from "./rocketChatTypes.js";

type RocketChatApiResponse = {
  success?: boolean;
  error?: string;
  room?: unknown;
};

const isRocketChatApiResponse = (value: unknown): value is RocketChatApiResponse => {
  return typeof value === "object" && value !== null;
};

export class RocketChatClient implements RocketChatClientPort {
  private readonly apiUrl: URL;
  private readonly healthUrl: URL;
  private readonly roomInfoUrl: URL;

  constructor(
    baseUrl: string,
    private readonly userId: string,
    private readonly authToken: string
  ) {
    this.apiUrl = new URL("/api/v1/chat.postMessage", baseUrl);
    this.healthUrl = new URL("/api/info", baseUrl);
    this.roomInfoUrl = new URL("/api/v1/rooms.info", baseUrl);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(this.healthUrl, {
        method: "GET"
      });

      metrics.rocketChatHealthcheckTotal.inc({
        result: response.ok ? "success" : "failure"
      });
      return response.ok;
    } catch {
      metrics.rocketChatHealthcheckTotal.inc({ result: "failure" });
      return false;
    }
  }

  async postMessage(
    payload: RocketChatPostMessagePayload
  ): Promise<RocketChatPostMessageResult> {
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": this.userId,
        "X-Auth-Token": this.authToken
      },
      body: JSON.stringify(payload)
    });

    const responseBody: unknown = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new ExternalServiceError(`Rocket.Chat request failed with status ${response.status}`);
    }

    if (!isRocketChatApiResponse(responseBody) || responseBody.success !== true) {
      const message =
        isRocketChatApiResponse(responseBody) && typeof responseBody.error === "string"
          ? responseBody.error
          : "Rocket.Chat returned an unexpected response";

      throw new ExternalServiceError(message);
    }

    return { ok: true };
  }

  async channelExists(channel: string): Promise<boolean> {
    const roomName = channel.startsWith("#") ? channel.slice(1) : channel;
    const url = new URL(this.roomInfoUrl);
    url.searchParams.set("roomName", roomName);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-User-Id": this.userId,
        "X-Auth-Token": this.authToken
      }
    });

    const responseBody: unknown = await response.json().catch(() => undefined);

    if (response.status === 404) {
      return false;
    }

    if (!response.ok) {
      throw new ExternalServiceError(`Rocket.Chat channel lookup failed with status ${response.status}`);
    }

    return isRocketChatApiResponse(responseBody) && responseBody.success === true && responseBody.room !== undefined;
  }
}
