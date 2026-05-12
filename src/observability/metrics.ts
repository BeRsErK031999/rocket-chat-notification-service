import { MetricsRegistry } from "./metricsRegistry.js";

export const metricsRegistry = new MetricsRegistry();

export const metrics = {
  httpRequestsTotal: metricsRegistry.counter(
    "http_requests_total",
    "Total HTTP requests processed by the service.",
    ["method", "path", "status"]
  ),
  eventsProcessedTotal: metricsRegistry.counter(
    "events_processed_total",
    "Total NATS events processed by result.",
    ["event", "result"]
  ),
  notificationsDeliveryAttemptsTotal: metricsRegistry.counter(
    "notifications_delivery_attempts_total",
    "Total Rocket.Chat notification delivery attempts by result.",
    ["result"]
  ),
  notificationsDeliveryRetriesTotal: metricsRegistry.counter(
    "notifications_delivery_retries_total",
    "Total Rocket.Chat notification delivery retries scheduled."
  ),
  dlqPublishedTotal: metricsRegistry.counter(
    "dlq_published_total",
    "Total events published to the DLQ.",
    ["event"]
  ),
  rocketChatHealthcheckTotal: metricsRegistry.counter(
    "rocket_chat_healthcheck_total",
    "Total Rocket.Chat health checks by result.",
    ["result"]
  )
};
