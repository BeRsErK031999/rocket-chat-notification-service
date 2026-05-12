import Fastify from "fastify";

import { env } from "./config/env.js";
import { startFinanceConsumer } from "./events/consumers/financeConsumer.js";
import { startMonitoringConsumer } from "./events/consumers/monitoringConsumer.js";
import { startProjectConsumer } from "./events/consumers/projectConsumer.js";
import { NatsClient } from "./events/eventBus/natsClient.js";
import { buildSupportedSubjects } from "./events/eventBus/subjectBuilder.js";
import { RocketChatClient } from "./integrations/rocket-chat/rocketChatClient.js";
import type { RocketChatClientPort } from "./integrations/rocket-chat/rocketChatTypes.js";
import { NotificationDeliveryService } from "./modules/notifications/delivery/notificationDeliveryService.js";
import { createRetryPolicy } from "./modules/notifications/delivery/retryPolicy.js";
import { createNotificationRoutes } from "./modules/notifications/notificationRoutes.js";
import { NotificationService } from "./modules/notifications/notificationService.js";
import { metrics } from "./observability/metrics.js";
import { createMetricsRoutes } from "./observability/metricsRoutes.js";
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
  void app.register(createMetricsRoutes());

  app.addHook("onResponse", (request, reply, done) => {
    metrics.httpRequestsTotal.inc({
      method: request.method,
      path: request.routeOptions.url ?? request.url,
      status: String(reply.statusCode)
    });
    done();
  });

  if (enableNatsConsumers) {
    app.addHook("onReady", async () => {
      await natsClient.ensureStream(env.NATS_STREAM_NAME, [
        ...buildSupportedSubjects(env.NATS_PREFIX),
        env.NATS_DLQ_SUBJECT
      ]);
      await startFinanceConsumer({
        natsClient,
        prefix: env.NATS_PREFIX,
        streamName: env.NATS_STREAM_NAME,
        durablePrefix: env.NATS_DURABLE_PREFIX,
        dlqSubject: env.NATS_DLQ_SUBJECT,
        notificationDeliveryService,
        logger: app.log
      });
      await startProjectConsumer({
        natsClient,
        prefix: env.NATS_PREFIX,
        streamName: env.NATS_STREAM_NAME,
        durablePrefix: env.NATS_DURABLE_PREFIX,
        dlqSubject: env.NATS_DLQ_SUBJECT,
        notificationDeliveryService,
        logger: app.log
      });
      await startMonitoringConsumer({
        natsClient,
        prefix: env.NATS_PREFIX,
        streamName: env.NATS_STREAM_NAME,
        durablePrefix: env.NATS_DURABLE_PREFIX,
        dlqSubject: env.NATS_DLQ_SUBJECT,
        notificationDeliveryService,
        logger: app.log
      });

      app.log.info(
        {
          natsUrl: env.NATS_URL,
          prefix: env.NATS_PREFIX,
          stream: env.NATS_STREAM_NAME,
          durablePrefix: env.NATS_DURABLE_PREFIX,
          dlqSubject: env.NATS_DLQ_SUBJECT
        },
        "nats jetstream consumers started"
      );
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
