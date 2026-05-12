import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default("info"),
  ROCKET_CHAT_URL: z.string().url(),
  ROCKET_CHAT_USER_ID: z.string().min(1),
  ROCKET_CHAT_AUTH_TOKEN: z.string().min(1)
});

export const env = envSchema.parse(process.env);

