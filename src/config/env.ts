import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default("info"),
  ROCKET_CHAT_URL: z.string().url(),
  ROCKET_CHAT_USER_ID: z.string().min(1),
  ROCKET_CHAT_AUTH_TOKEN: z.string().min(1),
  NATS_URL: z.string().url().default("nats://localhost:4222"),
  NATS_PREFIX: z.string().min(1).default("notifications"),
  DELIVERY_RETRY_ATTEMPTS: z.coerce.number().int().positive().default(3),
  DELIVERY_RETRY_DELAY_MS: z.coerce.number().int().nonnegative().default(500)
});

export const env = envSchema.parse(process.env);
