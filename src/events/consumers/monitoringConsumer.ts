import type { FastifyBaseLogger } from "fastify";

import type { NotificationDeliveryPort } from "../../modules/notifications/delivery/notificationDeliveryService.js";
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
  logger: FastifyBaseLogger;
};

export const startMonitoringConsumer = async ({
  natsClient,
  prefix,
  streamName,
  durablePrefix,
  dlqSubject,
  notificationDeliveryService,
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
          handleIncomingEvent({ subject, data, notificationDeliveryService, logger }),
        publishDlq: (subject, payload) => natsClient.publishJetStream(subject, payload)
      })
  });
};
