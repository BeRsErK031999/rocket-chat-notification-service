import { describe, expect, it, vi } from "vitest";

import type { RocketChatClientPort } from "../src/integrations/rocket-chat/rocketChatTypes.js";

process.env.PORT = "4000";
process.env.ROCKET_CHAT_URL = "http://localhost:3000";
process.env.ROCKET_CHAT_USER_ID = "test-user-id";
process.env.ROCKET_CHAT_AUTH_TOKEN = "test-auth-token";

describe("app", () => {
  it("returns health status", async () => {
    const { buildApp } = await import("../src/app.js");
    const app = buildApp();

    try {
      const response = await app.inject({
        method: "GET",
        url: "/health"
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: "ok" });
    } finally {
      await app.close();
    }
  });

  it("returns readiness status", async () => {
    const { buildApp } = await import("../src/app.js");
    const rocketChatClient: RocketChatClientPort = {
      postMessage: vi.fn<RocketChatClientPort["postMessage"]>().mockResolvedValue({ ok: true }),
      healthCheck: vi.fn<RocketChatClientPort["healthCheck"]>().mockResolvedValue(true)
    };
    const app = buildApp({ rocketChatClient });

    try {
      const response = await app.inject({
        method: "GET",
        url: "/ready"
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: "ok", rocketChat: "ok" });
    } finally {
      await app.close();
    }
  });

  it("returns unavailable readiness status when Rocket.Chat is unavailable", async () => {
    const { buildApp } = await import("../src/app.js");
    const rocketChatClient: RocketChatClientPort = {
      postMessage: vi.fn<RocketChatClientPort["postMessage"]>().mockResolvedValue({ ok: true }),
      healthCheck: vi.fn<RocketChatClientPort["healthCheck"]>().mockResolvedValue(false)
    };
    const app = buildApp({ rocketChatClient });

    try {
      const response = await app.inject({
        method: "GET",
        url: "/ready"
      });

      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({
        status: "unavailable",
        rocketChat: "unavailable"
      });
    } finally {
      await app.close();
    }
  });
});
