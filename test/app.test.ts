import { describe, expect, it } from "vitest";

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
    const app = buildApp();

    try {
      const response = await app.inject({
        method: "GET",
        url: "/ready"
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: "ok" });
    } finally {
      await app.close();
    }
  });
});
