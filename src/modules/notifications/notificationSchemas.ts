import { z } from "zod";

export const sendNotificationSchema = z.object({
  channel: z.string().min(1),
  text: z.string().min(1)
});

export type SendNotificationBody = z.infer<typeof sendNotificationSchema>;

