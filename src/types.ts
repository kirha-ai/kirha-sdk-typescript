export type SummarizationModel = "kirha" | "kirha-flash";

export type SummarizationConfig =
  | SummarizationModel
  | {
      model: SummarizationModel;
      instruction?: string;
    };

interface KirhaBaseConfig {
  apiKey: string;
  vertical?: string;
}

export interface KirhaApiConfig extends KirhaBaseConfig {
  planner?: never;
  summarization?: SummarizationConfig;
}

// biome-ignore lint/suspicious/noExplicitAny: handler needs to accept any input
export type LocalToolHandler = (input: any) => Promise<unknown>;

export interface LocalTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  handler: LocalToolHandler;
}

export interface KirhaLocalConfig extends KirhaBaseConfig {
  planner: string;
  tools?: LocalTool[];
}

export type KirhaConfig = KirhaApiConfig | KirhaLocalConfig;

export interface Tool {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

export interface ToolExecutionResult {
  toolName: string;
  output: unknown;
  isError: boolean;
  errorMessage?: string;
  usage: {
    estimated: number;
    consumed: number;
  };
}

export interface SearchOptions {
  vertical?: string;
  summarization?: SummarizationConfig | false;
  includeData?: boolean;
  includePlanning?: boolean;
}

export interface LocalSearchOptions {
  vertical?: string;
  tools?: LocalTool[];
}

export interface PlanStep {
  id: string;
  toolName: string;
  parameters: Record<string, unknown>;
  reasoning?: string;
}

export interface PlanningInfo {
  status: string;
  steps?: PlanStep[];
  reason?: string;
}

export interface SearchResult {
  id?: string;
  summary?: string;
  data?: unknown;
  planning?: PlanningInfo;
  usage?: PlanUsage;
  deterministicSignature?: string;
  account?: PlanAccount;
}

export interface PlanOptions {
  vertical?: string;
  summarization?: SummarizationConfig;
}

export interface PlanExecuteOptions {
  summarization?: SummarizationConfig | false;
  includeData?: boolean;
  includePlanning?: boolean;
}

export interface PlanStepResponse {
  id: string;
  toolName: string;
  parameters: Record<string, unknown>;
  reasoning?: string;
}

export interface PlanUsage {
  estimated: number;
  consumed: number;
}

export interface PlanAccount {
  balance: number;
  balanceTimestamp: string;
}

export interface PlanResponse {
  id: string;
  status: string;
  steps: PlanStepResponse[];
  reason?: string;
  usage: PlanUsage;
  account?: PlanAccount;
}

export interface ToolsOptions {
  vertical: string;
}

export interface ApiSearchRequest {
  query: string;
  vertical_id?: string;
  summarization?: {
    enable: boolean;
    model: string;
    instruction?: string;
  };
  include_raw_data?: boolean;
  include_planning?: boolean;
}

export interface ApiPlanRequest {
  query: string;
  vertical_id?: string;
}

export interface ApiPlanRunRequest {
  plan_id: string;
  summarization?: {
    enable: boolean;
    model: string;
    instruction?: string;
  };
  include_raw_data?: boolean;
  include_planning?: boolean;
}

export interface ApiExecuteToolRequest {
  tool_name: string;
  input: unknown;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export enum TaskStatus {
  Queued = "Queued",
  Researching = "Researching",
  Validating = "Validating",
  Summarizing = "Summarizing",
  Completed = "Completed",
  Failed = "Failed",
}

export interface TaskOptions {
  instruction?: string;
}

export interface TaskStatusResponse {
  id: string;
  status: TaskStatus;
}

export interface TaskResultResponse {
  id: string;
  status: TaskStatus;
  result: string | null;
  error: string | null;
}

export interface TaskWaitOptions {
  pollInterval?: number;
  timeout?: number;
}

export interface ApiCreateTaskRequest {
  query: string;
  instruction?: string;
}
