import type { FastifyBaseLogger } from "fastify";
import { ZodError } from "zod";

import { eventContractSchema } from "../contracts/index.js";
import type { NotificationEvent } from "../contracts/index.js";
import type { NotificationDeliveryPort } from "../../modules/notifications/delivery/notificationDeliveryService.js";
import { mapNotificationEvent } from "../../modules/notifications/mappers/notificationEventMapper.js";
import type { SendNotificationInput } from "../../modules/notifications/notificationTypes.js";

export type EventProcessingResult =
  | { status: "success"; eventId: string; correlationId?: string }
  | { status: "validation_failed" }
  | { status: "mapping_failed"; eventId: string; correlationId?: string }
  | { status: "delivery_failed"; eventId: string; correlationId?: string };

const buildResult = (
  status: Exclude<EventProcessingResult["status"], "validation_failed">,
  eventId: string,
  correlationId: string | undefined
): EventProcessingResult => {
  if (correlationId === undefined) {
    return { status, eventId };
  }

  return { status, eventId, correlationId };
};

const buildDeliveryContext = (
  eventId: string,
  correlationId: string | undefined
): { eventId: string; correlationId?: string } => {
  if (correlationId === undefined) {
    return { eventId };
  }

  return { eventId, correlationId };
};

type HandleEventInput = {
  subject: string;
  data: unknown;
  notificationDeliveryService: NotificationDeliveryPort;
  logger: FastifyBaseLogger;
  mapEvent?: (event: NotificationEvent) => SendNotificationInput;
};

const readStringField = (data: unknown, field: string): string | undefined => {
  if (typeof data !== "object" || data === null || !(field in data)) {
    return undefined;
  }

  const value = (data as Record<string, unknown>)[field];

  return typeof value === "string" ? value : undefined;
};

export const handleIncomingEvent = async ({
  subject,
  data,
  notificationDeliveryService,
  logger,
  mapEvent = mapNotificationEvent
}: HandleEventInput): Promise<EventProcessingResult> => {
  try {
    const event = eventContractSchema.parse(data);
    const logContext = {
      eventId: event.eventId,
      correlationId: event.correlationId,
      subject,
      event: event.event,
      severity: event.severity ?? "info",
      source: event.source
    };

    logger.info(logContext, "nats event received");

    let notification: SendNotificationInput;

    try {
      notification = mapEvent(event);
    } catch (error) {
      logger.error({ err: error, ...logContext }, "nats event mapping failed");
      return buildResult("mapping_failed", event.eventId, event.correlationId);
    }

    try {
      await notificationDeliveryService.deliver(notification, {
        ...buildDeliveryContext(event.eventId, event.correlationId)
      });
    } catch (error) {
      logger.error({ err: error, ...logContext }, "nats event delivery failed");
      return buildResult("delivery_failed", event.eventId, event.correlationId);
    }

    logger.info(logContext, "nats event processed");

    return buildResult("success", event.eventId, event.correlationId);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn(
        {
          eventId: readStringField(data, "eventId"),
          correlationId: readStringField(data, "correlationId"),
          subject,
          event: readStringField(data, "event"),
          severity: readStringField(data, "severity"),
          source: readStringField(data, "source"),
          details: error.flatten()
        },
        "invalid nats event ignored"
      );
      return { status: "validation_failed" };
    }

    logger.error({ err: error, subject }, "nats event processing failed");
    return { status: "validation_failed" };
  }
};
