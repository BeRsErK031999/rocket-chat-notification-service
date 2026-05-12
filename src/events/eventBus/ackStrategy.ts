import type { FastifyBaseLogger } from "fastify";

import type { EventProcessingResult } from "../consumers/consumerHandler.js";
import { buildDeadLetterPayload } from "./dlq.js";

export type AcknowledgeableMessage = {
  subject: string;
  data: unknown;
  ack(): void;
};

type AckStrategyInput = {
  message: AcknowledgeableMessage;
  dlqSubject: string;
  logger: FastifyBaseLogger;
  handleEvent: (subject: string, data: unknown) => Promise<EventProcessingResult>;
  publishDlq: (subject: string, payload: unknown) => Promise<void>;
};

export const processJetStreamMessage = async ({
  message,
  dlqSubject,
  logger,
  handleEvent,
  publishDlq
}: AckStrategyInput): Promise<EventProcessingResult> => {
  const result = await handleEvent(message.subject, message.data);

  if (result.status === "delivery_failed") {
    const payload = buildDeadLetterPayload(message.subject, message.data, result.status);

    await publishDlq(dlqSubject, payload);
    logger.error(
      {
        eventId: result.eventId,
        correlationId: result.correlationId,
        subject: message.subject,
        dlqSubject
      },
      "nats event published to dlq"
    );
  }

  message.ack();
  return result;
};
