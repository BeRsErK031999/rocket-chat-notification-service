import { z } from "zod";

export const eventSeveritySchema = z.enum(["info", "warning", "critical"]);

export const baseEventSchema = z
  .object({
    eventId: z.string().min(1),
    correlationId: z.string().min(1).optional(),
    timestamp: z.string().datetime(),
    source: z.string().min(1),
    event: z.string().min(1),
    severity: eventSeveritySchema.optional(),
    payload: z.unknown()
  })
  .strict();

export type EventSeverity = z.infer<typeof eventSeveritySchema>;
export type BaseEvent = z.infer<typeof baseEventSchema>;
