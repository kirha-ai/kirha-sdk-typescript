import { z } from "zod";
import { TaskStatus } from "./types";

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
    id: z.string().optional(),
    summary: z.string().optional(),
    raw_data: z.unknown().optional(),
    planning: z
      .object({
        status: z.string(),
        steps: z
          .array(
            z.object({
              id: z.string(),
              tool_name: z.string(),
              parameters: z.record(z.unknown()),
              reasoning: z.string().optional(),
            }),
          )
          .optional(),
        reason: z.string().optional(),
      })
      .optional(),
    usage: UsageSchema.optional(),
    deterministicSignature: z.string().optional(),
    account: AccountSchema.optional(),
  })
  .transform((data) => ({
    id: data.id,
    summary: data.summary,
    data: data.raw_data,
    planning: data.planning
      ? {
          status: data.planning.status,
          steps: data.planning.steps?.map((s) => ({
            id: s.id,
            toolName: s.tool_name,
            parameters: s.parameters,
            reasoning: s.reasoning,
          })),
          reason: data.planning.reason,
        }
      : undefined,
    usage: data.usage,
    deterministicSignature: data.deterministicSignature,
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

const NestedErrorSchema = z.object({
  success: z.literal(false).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

const FlatErrorSchema = z.object({
  type: z.string(),
  reason: z.string(),
});

export const ApiErrorResponseSchema = z.union([
  NestedErrorSchema.transform((data) => ({
    code: data.error.code,
    message: data.error.message,
    details: data.error.details,
  })),
  FlatErrorSchema.transform((data) => ({
    code: data.type,
    message: data.reason,
    details: undefined,
  })),
]);

// Task schemas
export const TaskStatusSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(TaskStatus),
});

export const TaskResultSchema = TaskStatusSchema.extend({
  result: z.string().nullable(),
  error: z.string().nullable(),
});
