import { z } from "zod";

import { baseEventSchema } from "../baseEvent.js";

export const projectDeadlineOverduePayloadSchema = z
  .object({
    projectId: z.string().min(1),
    projectName: z.string().min(1),
    deadline: z.string().datetime(),
    daysOverdue: z.number().int().positive(),
    channel: z.string().min(1).optional()
  })
  .strict();

export const projectDeadlineOverdueEventSchema = baseEventSchema.extend({
  event: z.literal("project.deadline.overdue"),
  payload: projectDeadlineOverduePayloadSchema
});

export type ProjectDeadlineOverdueEvent = z.infer<typeof projectDeadlineOverdueEventSchema>;
