import { z } from "zod";

export const ToolSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    input_schema: z.record(z.unknown()),
    output_schema: z.record(z.unknown()),
  })
  .transform((data) => ({
    id: data.id,
    name: data.name,
    description: data.description,
    inputSchema: data.input_schema,
    outputSchema: data.output_schema,
  }));

export const ToolsResponseSchema = z.array(ToolSchema);

export const PlanStepSchema = z
  .object({
    tool_name: z.string(),
    arguments: z.record(z.unknown()),
  })
  .transform((data) => ({
    toolName: data.tool_name,
    arguments: data.arguments,
  }));

export const PlanningInfoSchema = z
  .object({
    plan_id: z.string(),
    steps: z.array(PlanStepSchema).optional(),
  })
  .transform((data) => ({
    planId: data.plan_id,
    steps: data.steps,
  }));

export const AccountSchema = z
  .object({
    balance: z.number(),
    balance_timestamp: z.string(),
  })
  .transform((data) => ({
    balance: data.balance,
    balanceTimestamp: data.balance_timestamp,
  }));

export const UsageSchema = z.object({
  estimated: z.number(),
  consumed: z.number(),
});

export const SearchResultSchema = z
  .object({
    summary: z.string().optional(),
    raw_data: z.unknown().optional(),
    planning: z
      .object({
        plan_id: z.string(),
        steps: z
          .array(
            z.object({
              tool_name: z.string(),
              arguments: z.record(z.unknown()),
            }),
          )
          .optional(),
      })
      .optional(),
    usage: UsageSchema.optional(),
    account: AccountSchema.optional(),
  })
  .transform((data) => ({
    summary: data.summary,
    rawData: data.raw_data,
    planning: data.planning
      ? {
          planId: data.planning.plan_id,
          steps: data.planning.steps?.map((s) => ({
            toolName: s.tool_name,
            arguments: s.arguments,
          })),
        }
      : undefined,
    usage: data.usage,
    account: data.account,
  }));

export const PlanStepResponseSchema = z
  .object({
    id: z.string(),
    tool_name: z.string(),
    parameters: z.record(z.unknown()),
    reasoning: z.string().optional(),
  })
  .transform((data) => ({
    id: data.id,
    toolName: data.tool_name,
    parameters: data.parameters,
    reasoning: data.reasoning,
  }));

export const PlanResponseSchema = z
  .object({
    id: z.string(),
    status: z.string(),
    steps: z.array(PlanStepResponseSchema),
    reason: z.string().optional(),
    usage: UsageSchema,
    account: AccountSchema.optional(),
  })
  .transform((data) => ({
    id: data.id,
    status: data.status,
    steps: data.steps,
    reason: data.reason,
    usage: data.usage,
    account: data.account,
  }));

export const ToolExecutionResultSchema = z
  .object({
    tool_name: z.string(),
    output: z.unknown(),
    is_error: z.boolean(),
    error_message: z.string().optional(),
    usage: UsageSchema,
  })
  .transform((data) => ({
    toolName: data.tool_name,
    output: data.output as unknown,
    isError: data.is_error,
    errorMessage: data.error_message,
    usage: data.usage,
  }));

export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
