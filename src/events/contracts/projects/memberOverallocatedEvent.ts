import { z } from "zod";

import { baseEventSchema } from "../baseEvent.js";

export const projectMemberOverallocatedPayloadSchema = z
  .object({
    projectId: z.string().min(1),
    projectName: z.string().min(1),
    memberId: z.string().min(1),
    memberName: z.string().min(1),
    allocationPercent: z.number().positive(),
    channel: z.string().min(1).optional()
  })
  .strict();

export const projectMemberOverallocatedEventSchema = baseEventSchema.extend({
  event: z.literal("project.member.overallocated"),
  payload: projectMemberOverallocatedPayloadSchema
});

export type ProjectMemberOverallocatedEvent = z.infer<
  typeof projectMemberOverallocatedEventSchema
>;
