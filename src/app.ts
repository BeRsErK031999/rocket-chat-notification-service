import Fastify from "fastify";

import { env } from "./config/env.js";
import { RocketChatClient } from "./integrations/rocket-chat/rocketChatClient.js";
import { createNotificationRoutes } from "./modules/notifications/notificationRoutes.js";
import { NotificationService } from "./modules/notifications/notificationService.js";
import { logger } from "./shared/logger.js";

export const buildApp = () => {
  const app = Fastify({
    loggerInstance: logger
  });

  const rocketChatClient = new RocketChatClient(
    env.ROCKET_CHAT_URL,
    env.ROCKET_CHAT_USER_ID,
    env.ROCKET_CHAT_AUTH_TOKEN
  );
  const notificationService = new NotificationService(rocketChatClient);

  void app.register(createNotificationRoutes({ notificationService }), {
    prefix: "/notifications"
  });

  app.get("/health", () => {
    return { status: "ok" };
  });

  app.get("/ready", () => {
    return { status: "ok" };
  });

  return app;
};
