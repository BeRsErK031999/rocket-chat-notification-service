import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default("info"),
  ROCKET_CHAT_URL: z.string().url(),
  ROCKET_CHAT_USER_ID: z.string().min(1),
  ROCKET_CHAT_AUTH_TOKEN: z.string().min(1),
  INTERNAL_API_KEY: z.string().optional(),
  NATS_URL: z.string().url().default("nats://localhost:4222"),
  NATS_PREFIX: z.string().min(1).default("notifications"),
  NATS_STREAM_NAME: z.string().min(1).default("NOTIFICATIONS"),
  NATS_DURABLE_PREFIX: z.string().min(1).default("rocket-chat-notification-service"),
  NATS_DLQ_SUBJECT: z.string().min(1).default("notifications.dlq"),
  DELIVERY_RETRY_ATTEMPTS: z.coerce.number().int().positive().default(3),
  DELIVERY_RETRY_DELAY_MS: z.coerce.number().int().nonnegative().default(500),
  IDEMPOTENCY_TTL_MS: z.coerce.number().int().positive().default(86400000),
  DEFAULT_NOTIFICATION_CHANNEL: z.string().min(1).default("general"),
  FINANCE_ALERTS_CHANNEL: z.string().min(1).default("finance-alerts"),
  PROJECT_ALERTS_CHANNEL_PREFIX: z.string().min(1).default("project-"),
  MONITORING_ALERTS_CHANNEL: z.string().min(1).default("monitoring-alerts"),
  APP_BASE_URL: z.union([z.string().url(), z.literal("")]).default(""),
  PROJECT_PAGE_PATH_TEMPLATE: z.string().min(1).default("/projects/:projectId"),
  FINANCE_PAGE_PATH_TEMPLATE: z.string().min(1).default("/projects/:projectId/finance"),
  MONITORING_PAGE_PATH_TEMPLATE: z
    .string()
    .min(1)
    .default("/monitoring/employees/:employeeId")
});

export const env = envSchema.parse(process.env);
