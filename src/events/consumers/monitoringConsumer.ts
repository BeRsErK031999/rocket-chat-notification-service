import type { FastifyBaseLogger } from "fastify";

import type { NotificationDeliveryPort } from "../../modules/notifications/delivery/notificationDeliveryService.js";
import { buildSubject } from "../eventBus/subjectBuilder.js";
import type { NatsClient } from "../eventBus/natsClient.js";
import { handleIncomingEvent } from "./consumerHandler.js";

type MonitoringConsumerInput = {
  natsClient: NatsClient;
  prefix: string;
  notificationDeliveryService: NotificationDeliveryPort;
  logger: FastifyBaseLogger;
};

export const startMonitoringConsumer = async ({
  natsClient,
  prefix,
  notificationDeliveryService,
  logger
}: MonitoringConsumerInput): Promise<void> => {
  await natsClient.subscribe(buildSubject(prefix, "monitoring.employee.afk"), (subject, data) =>
    handleIncomingEvent({ subject, data, notificationDeliveryService, logger })
  );
};
