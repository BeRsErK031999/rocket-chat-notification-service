import type { FastifyBaseLogger } from "fastify";

import { metrics } from "../../../observability/metrics.js";
import type { SendNotificationInput, SendNotificationResult } from "../notificationTypes.js";
import type { NotificationService } from "../notificationService.js";
import type { RetryPolicy } from "./retryPolicy.js";

type DeliveryContext = {
  eventId: string;
  correlationId?: string;
};

export type NotificationDeliveryPort = {
  deliver(
    input: SendNotificationInput,
    context: DeliveryContext
  ): Promise<SendNotificationResult>;
};

type Delay = (delayMs: number) => Promise<void>;

const defaultDelay: Delay = (delayMs) => {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
};

export class NotificationDeliveryService implements NotificationDeliveryPort {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly retryPolicy: RetryPolicy,
    private readonly logger: FastifyBaseLogger,
    private readonly delay: Delay = defaultDelay
  ) {}

  async deliver(
    input: SendNotificationInput,
    context: DeliveryContext
  ): Promise<SendNotificationResult> {
    for (let attempt = 1; attempt <= this.retryPolicy.attempts; attempt += 1) {
      try {
        const result = await this.notificationService.send(input);
        metrics.notificationsDeliveryAttemptsTotal.inc({ result: "success" });
        return result;
      } catch (error) {
        metrics.notificationsDeliveryAttemptsTotal.inc({ result: "failure" });

        if (attempt >= this.retryPolicy.attempts) {
          throw error;
        }

        metrics.notificationsDeliveryRetriesTotal.inc();
        loggerRetry(this.logger, context, attempt, this.retryPolicy);
        await this.delay(this.retryPolicy.delayMs);
      }
    }

    throw new Error("Notification delivery retry attempts exhausted");
  }
}

const loggerRetry = (
  logger: FastifyBaseLogger,
  context: DeliveryContext,
  attempt: number,
  retryPolicy: RetryPolicy
): void => {
  logger.warn(
    {
      eventId: context.eventId,
      correlationId: context.correlationId,
      attempt,
      maxAttempts: retryPolicy.attempts,
      delayMs: retryPolicy.delayMs
    },
    "notification delivery retry scheduled"
  );
};
