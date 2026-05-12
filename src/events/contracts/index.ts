import { z } from "zod";

import { financeBudgetExceededEventSchema } from "./finance/budgetExceededEvent.js";
import { monitoringEmployeeAfkEventSchema } from "./monitoring/employeeAfkEvent.js";
import { projectDeadlineOverdueEventSchema } from "./projects/deadlineOverdueEvent.js";
import { projectMemberOverallocatedEventSchema } from "./projects/memberOverallocatedEvent.js";

export const eventContractSchema = z.discriminatedUnion("event", [
  projectDeadlineOverdueEventSchema,
  projectMemberOverallocatedEventSchema,
  financeBudgetExceededEventSchema,
  monitoringEmployeeAfkEventSchema
]);

export type NotificationEvent = z.infer<typeof eventContractSchema>;
export type NotificationEventName = NotificationEvent["event"];

export const supportedEventNames = [
  "project.deadline.overdue",
  "project.member.overallocated",
  "finance.budget.exceeded",
  "monitoring.employee.afk"
] as const satisfies readonly NotificationEventName[];
