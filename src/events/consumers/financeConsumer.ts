import type { FastifyBaseLogger } from "fastify";

import type { NotificationDeliveryPort } from "../../modules/notifications/delivery/notificationDeliveryService.js";
import { buildSubject } from "../eventBus/subjectBuilder.js";
import type { NatsClient } from "../eventBus/natsClient.js";
import { handleIncomingEvent } from "./consumerHandler.js";

type FinanceConsumerInput = {
  natsClient: NatsClient;
  prefix: string;
  notificationDeliveryService: NotificationDeliveryPort;
  logger: FastifyBaseLogger;
};

export const startFinanceConsumer = async ({
  natsClient,
  prefix,
  notificationDeliveryService,
  logger
}: FinanceConsumerInput): Promise<void> => {
  await natsClient.subscribe(buildSubject(prefix, "finance.budget.exceeded"), (subject, data) =>
    handleIncomingEvent({ subject, data, notificationDeliveryService, logger })
  );
};
