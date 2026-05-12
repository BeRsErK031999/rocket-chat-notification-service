import type { FastifyBaseLogger } from "fastify";

import type { IdempotencyStore } from "../idempotency/idempotencyStore.js";
import type { NotificationDeliveryPort } from "../../modules/notifications/delivery/notificationDeliveryService.js";
import type { NotificationRouter } from "../../modules/notifications/routing/routingTypes.js";
import { processJetStreamMessage } from "../eventBus/ackStrategy.js";
import { buildDurableName } from "../eventBus/subjectBuilder.js";
import type { NatsClient } from "../eventBus/natsClient.js";
import { handleIncomingEvent } from "./consumerHandler.js";

type ProjectConsumerInput = {
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

export const startProjectConsumer = async ({
  natsClient,
  prefix,
  streamName,
  durablePrefix,
  dlqSubject,
  notificationDeliveryService,
  idempotencyStore,
  notificationRouter,
  logger
}: ProjectConsumerInput): Promise<void> => {
  await natsClient.subscribeDurable({
    streamName,
    durableName: buildDurableName(durablePrefix, "project"),
    filterSubject: `${prefix}.project.>`,
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
