import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RocketChatClientPort } from "../src/integrations/rocket-chat/rocketChatTypes.js";
import { metricsRegistry } from "../src/observability/metrics.js";

process.env.PORT = "4000";
process.env.ROCKET_CHAT_URL = "http://localhost:3000";
process.env.ROCKET_CHAT_USER_ID = "test-user-id";
process.env.ROCKET_CHAT_AUTH_TOKEN = "test-auth-token";

const createRocketChatClient = (): RocketChatClientPort => ({
  postMessage: vi.fn<RocketChatClientPort["postMessage"]>().mockResolvedValue({ ok: true }),
  healthCheck: vi.fn<RocketChatClientPort["healthCheck"]>().mockResolvedValue(true),
  channelExists: vi.fn<RocketChatClientPort["channelExists"]>().mockResolvedValue(true)
});

describe("app", () => {
  beforeEach(() => {
    metricsRegistry.reset();
  });

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
    const rocketChatClient = createRocketChatClient();
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
      healthCheck: vi.fn<RocketChatClientPort["healthCheck"]>().mockResolvedValue(false),
      channelExists: vi.fn<RocketChatClientPort["channelExists"]>().mockResolvedValue(true)
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

  it("returns prometheus metrics", async () => {
    const { buildApp } = await import("../src/app.js");
    const app = buildApp();

    try {
      const response = await app.inject({
        method: "GET",
        url: "/metrics"
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toContain("text/plain");
      expect(response.body).toContain("# TYPE http_requests_total counter");
    } finally {
      await app.close();
    }
  });

  it("does not require internal API key when it is not configured", async () => {
    const { buildApp } = await import("../src/app.js");
    const app = buildApp({
      rocketChatClient: createRocketChatClient(),
      internalApiKey: undefined
    });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/notifications/send",
        payload: {
          channel: "#notifications",
          text: "test"
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ ok: true });
    } finally {
      await app.close();
    }
  });

  it("returns 401 when internal API key is configured and header is missing", async () => {
    const { buildApp } = await import("../src/app.js");
    const app = buildApp({
      rocketChatClient: createRocketChatClient(),
      internalApiKey: "secret"
    });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/notifications/send",
        payload: {
          channel: "#notifications",
          text: "test"
        }
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ error: "Unauthorized" });
    } finally {
      await app.close();
    }
  });

  it("returns 401 when internal API key header is invalid", async () => {
    const { buildApp } = await import("../src/app.js");
    const app = buildApp({
      rocketChatClient: createRocketChatClient(),
      internalApiKey: "secret"
    });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/notifications/send",
        headers: {
          "x-internal-api-key": "wrong"
        },
        payload: {
          channel: "#notifications",
          text: "test"
        }
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ error: "Unauthorized" });
    } finally {
      await app.close();
    }
  });

  it("sends notification when internal API key header is valid", async () => {
    const { buildApp } = await import("../src/app.js");
    const app = buildApp({
      rocketChatClient: createRocketChatClient(),
      internalApiKey: "secret"
    });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/notifications/send",
        headers: {
          "x-internal-api-key": "secret"
        },
        payload: {
          channel: "#notifications",
          text: "test"
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ ok: true });
    } finally {
      await app.close();
    }
  });

  it("does not require internal API key for health readiness or metrics", async () => {
    const { buildApp } = await import("../src/app.js");
    const app = buildApp({
      rocketChatClient: createRocketChatClient(),
      internalApiKey: "secret"
    });

    try {
      const healthResponse = await app.inject({ method: "GET", url: "/health" });
      const readyResponse = await app.inject({ method: "GET", url: "/ready" });
      const metricsResponse = await app.inject({ method: "GET", url: "/metrics" });

      expect(healthResponse.statusCode).toBe(200);
      expect(readyResponse.statusCode).toBe(200);
      expect(metricsResponse.statusCode).toBe(200);
    } finally {
      await app.close();
    }
  });
});
