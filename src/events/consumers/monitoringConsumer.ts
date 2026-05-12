import type { FastifyBaseLogger } from "fastify";

import type { IdempotencyStore } from "../idempotency/idempotencyStore.js";
import type { NotificationDeliveryPort } from "../../modules/notifications/delivery/notificationDeliveryService.js";
import type { NotificationRouter } from "../../modules/notifications/routing/routingTypes.js";
import { processJetStreamMessage } from "../eventBus/ackStrategy.js";
import { buildDurableName, buildSubject } from "../eventBus/subjectBuilder.js";
import type { NatsClient } from "../eventBus/natsClient.js";
import { handleIncomingEvent } from "./consumerHandler.js";

type MonitoringConsumerInput = {
  natsClient: NatsClient;
  prefix: string;
  streamName: string;
  durablePrefix: string;
  dlqSubject: string;
  notificationDeliveryService: NotificationDeliveryPort;
  idempotencyStore: IdempotencyStore;
  notificationRouter: NotificationRouter;
  logger: FastifyBaseLogger;
};

export const startMonitoringConsumer = async ({
  natsClient,
  prefix,
  streamName,
  durablePrefix,
  dlqSubject,
  notificationDeliveryService,
  idempotencyStore,
  notificationRouter,
  logger
}: MonitoringConsumerInput): Promise<void> => {
  await natsClient.subscribeDurable({
    streamName,
    durableName: buildDurableName(durablePrefix, "monitoring"),
    filterSubject: buildSubject(prefix, "monitoring.employee.afk"),
    handler: (message) =>
      processJetStreamMessage({
        message,
        dlqSubject,
        logger,
        handleEvent: (subject, data) =>
          handleIncomingEvent({
            subject,
            data,
            notificationDeliveryService,
            idempotencyStore,
            notificationRouter,
            logger
          }),
        publishDlq: (subject, payload) => natsClient.publishJetStream(subject, payload)
      })
  });
};
