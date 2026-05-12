import { z } from "zod";

import { baseEventSchema } from "../baseEvent.js";

export const financeBudgetExceededPayloadSchema = z
  .object({
    budgetId: z.string().min(1),
    budgetName: z.string().min(1),
    actualAmount: z.number().nonnegative(),
    limitAmount: z.number().positive(),
    currency: z.string().min(1),
    channel: z.string().min(1).optional()
  })
  .strict();

export const financeBudgetExceededEventSchema = baseEventSchema.extend({
  event: z.literal("finance.budget.exceeded"),
  payload: financeBudgetExceededPayloadSchema
});

export type FinanceBudgetExceededEvent = z.infer<typeof financeBudgetExceededEventSchema>;
