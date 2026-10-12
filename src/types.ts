export type SummarizationConfig = true | { instruction?: string };

interface KirhaBaseConfig {
  apiKey: string;
  focus?: string;
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

export enum PlanningRuntime {
  Standard = "standard",
  Fast = "fast",
}

export interface SearchOptions {
  focus?: string;
  summarization?: SummarizationConfig | false;
  includeData?: boolean;
  includePlanning?: boolean;
  planningRuntime?: PlanningRuntime;
}

export interface LocalSearchOptions {
  focus?: string;
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
  account?: PlanAccount;
}

export interface PlanOptions {
  focus?: string;
  summarization?: SummarizationConfig;
  planningRuntime?: PlanningRuntime;
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
  focus: string;
}

export interface ApiSummarization {
  enable: boolean;
  instruction?: string;
}

export interface ApiSearchRequest {
  query: string;
  focus?: string;
  summarization?: ApiSummarization;
  include_raw_data?: boolean;
  include_planning?: boolean;
  planning_runtime?: PlanningRuntime;
}

export interface ApiPlanRequest {
  query: string;
  focus?: string;
  planning_runtime?: PlanningRuntime;
}

export interface ApiPlanRunRequest {
  id: string;
  summarization?: ApiSummarization;
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
