import { z } from "zod";

import { baseEventSchema } from "../baseEvent.js";

export const monitoringEmployeeAfkPayloadSchema = z
  .object({
    employeeId: z.string().min(1),
    employeeName: z.string().min(1),
    minutesAfk: z.number().int().positive(),
    channel: z.string().min(1).optional()
  })
  .strict();

export const monitoringEmployeeAfkEventSchema = baseEventSchema.extend({
  event: z.literal("monitoring.employee.afk"),
  payload: monitoringEmployeeAfkPayloadSchema
});

export type MonitoringEmployeeAfkEvent = z.infer<typeof monitoringEmployeeAfkEventSchema>;
