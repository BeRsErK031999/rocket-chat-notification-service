import "dotenv/config";

import { buildSubject } from "../src/events/eventBus/subjectBuilder.js";
import { NatsClient } from "../src/events/eventBus/natsClient.js";
import { env } from "../src/config/env.js";

const event = {
  eventId: crypto.randomUUID(),
  event: "finance.budget.exceeded",
  timestamp: new Date().toISOString(),
  source: "local-dev-publisher",
  severity: "critical",
  payload: {
    budgetId: "budget-local-001",
    budgetName: "Local test budget",
    actualAmount: 125000,
    limitAmount: 100000,
    currency: "USD",
    channel: "#notifications"
  }
} as const;

const publish = async (): Promise<void> => {
  const client = new NatsClient(env.NATS_URL);
  const subject = buildSubject(env.NATS_PREFIX, event.event);

  try {
    await client.publish(subject, event);
    console.info(
      JSON.stringify({
        subject,
        eventId: event.eventId,
        event: event.event,
        severity: event.severity,
        source: event.source
      })
    );
  } finally {
    await client.close();
  }
};

void publish();
