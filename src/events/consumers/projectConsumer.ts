import type { FastifyBaseLogger } from "fastify";

import type { NotificationDeliveryPort } from "../../modules/notifications/delivery/notificationDeliveryService.js";
import { buildSubject } from "../eventBus/subjectBuilder.js";
import type { NatsClient } from "../eventBus/natsClient.js";
import { handleIncomingEvent } from "./consumerHandler.js";

type ProjectConsumerInput = {
  natsClient: NatsClient;
  prefix: string;
  notificationDeliveryService: NotificationDeliveryPort;
  logger: FastifyBaseLogger;
};

export const startProjectConsumer = async ({
  natsClient,
  prefix,
  notificationDeliveryService,
  logger
}: ProjectConsumerInput): Promise<void> => {
  await natsClient.subscribe(buildSubject(prefix, "project.deadline.overdue"), (subject, data) =>
    handleIncomingEvent({ subject, data, notificationDeliveryService, logger })
  );
  await natsClient.subscribe(
    buildSubject(prefix, "project.member.overallocated"),
    (subject, data) => handleIncomingEvent({ subject, data, notificationDeliveryService, logger })
  );
};
