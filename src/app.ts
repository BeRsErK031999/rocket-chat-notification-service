import Fastify from "fastify";

import { env } from "./config/env.js";
import { startFinanceConsumer } from "./events/consumers/financeConsumer.js";
import { startMonitoringConsumer } from "./events/consumers/monitoringConsumer.js";
import { startProjectConsumer } from "./events/consumers/projectConsumer.js";
import { NatsClient } from "./events/eventBus/natsClient.js";
import { RocketChatClient } from "./integrations/rocket-chat/rocketChatClient.js";
import type { RocketChatClientPort } from "./integrations/rocket-chat/rocketChatTypes.js";
import { NotificationDeliveryService } from "./modules/notifications/delivery/notificationDeliveryService.js";
import { createRetryPolicy } from "./modules/notifications/delivery/retryPolicy.js";
import { createNotificationRoutes } from "./modules/notifications/notificationRoutes.js";
import { NotificationService } from "./modules/notifications/notificationService.js";
import { logger } from "./shared/logger.js";

type BuildAppOptions = {
  enableNatsConsumers?: boolean;
  rocketChatClient?: RocketChatClientPort;
};

export const buildApp = ({
  enableNatsConsumers = process.env.NODE_ENV !== "test",
  rocketChatClient = new RocketChatClient(
    env.ROCKET_CHAT_URL,
    env.ROCKET_CHAT_USER_ID,
    env.ROCKET_CHAT_AUTH_TOKEN
  )
}: BuildAppOptions = {}) => {
  const app = Fastify({
    loggerInstance: logger
  });

  const notificationService = new NotificationService(rocketChatClient);
  const notificationDeliveryService = new NotificationDeliveryService(
    notificationService,
    createRetryPolicy(env.DELIVERY_RETRY_ATTEMPTS, env.DELIVERY_RETRY_DELAY_MS),
    app.log
  );
  const natsClient = new NatsClient(env.NATS_URL);

  void app.register(createNotificationRoutes({ notificationService }), {
    prefix: "/notifications"
  });

  if (enableNatsConsumers) {
    app.addHook("onReady", async () => {
      await startFinanceConsumer({
        natsClient,
        prefix: env.NATS_PREFIX,
        notificationDeliveryService,
        logger: app.log
      });
      await startProjectConsumer({
        natsClient,
        prefix: env.NATS_PREFIX,
        notificationDeliveryService,
        logger: app.log
      });
      await startMonitoringConsumer({
        natsClient,
        prefix: env.NATS_PREFIX,
        notificationDeliveryService,
        logger: app.log
      });

      app.log.info({ natsUrl: env.NATS_URL, prefix: env.NATS_PREFIX }, "nats consumers started");
    });

    app.addHook("onClose", async () => {
      await natsClient.close();
    });
  }

  app.get("/health", () => {
    return { status: "ok" };
  });

  app.get("/ready", async (_request, reply) => {
    const rocketChatAvailable = await rocketChatClient.healthCheck();

    if (!rocketChatAvailable) {
      return reply.status(503).send({
        status: "unavailable",
        rocketChat: "unavailable"
      });
    }

    return reply.send({
      status: "ok",
      rocketChat: "ok"
    });
  });

  return app;
};
