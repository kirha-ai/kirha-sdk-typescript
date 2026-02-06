import {
  ApiError,
  AuthenticationError,
  RateLimitError,
  NetworkError,
  type ApiErrorCode,
} from "./errors";
import {
  SearchResultSchema,
  PlanResponseSchema,
  ToolsResponseSchema,
  ToolExecutionResultSchema,
  ApiErrorResponseSchema,
} from "./schemas";
import type {
  Tool,
  ToolExecutionResult,
  SearchResult,
  PlanResponse,
  SummarizationConfig,
  ApiSearchRequest,
  ApiPlanRequest,
  ApiPlanRunRequest,
  ApiExecuteToolRequest,
} from "./types";

const BASE_URL = "https://api.kirha.ai/chat/v1";
const DEFAULT_TIMEOUT = 120_000;

export interface ApiServiceConfig {
  apiKey: string;
  timeout?: number;
}

export class ApiService {
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(config: ApiServiceConfig) {
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
  }

  private getHeaders(): Headers {
    return new Headers({
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    });
  }

  private async handleResponse<T>(
    response: Response,
    schema: { parse: (data: unknown) => T },
  ): Promise<T> {
    if (response.ok) {
      const data = await response.json();
      return schema.parse(data);
    }

    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        "unknown_error",
      );
    }

    const parsed = ApiErrorResponseSchema.safeParse(errorBody);
    if (parsed.success) {
      const error = parsed.data;

      if (response.status === 401) {
        throw new AuthenticationError(error.message);
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        throw new RateLimitError(
          error.message,
          retryAfter ? Number.parseInt(retryAfter, 10) : undefined,
        );
      }

      throw new ApiError(
        error.message,
        response.status,
        error.code as ApiErrorCode,
        error.details,
      );
    }

    throw new ApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      "unknown_error",
      errorBody,
    );
  }

  private async get<T>(
    path: string,
    schema: { parse: (data: unknown) => T },
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(this.timeout),
      });

      return this.handleResponse(response, schema);
    } catch (error) {
      if (
        error instanceof ApiError ||
        error instanceof AuthenticationError ||
        error instanceof RateLimitError
      ) {
        throw error;
      }
      throw new NetworkError(
        `Failed to connect to ${url.toString()}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  private async post<T>(
    path: string,
    schema: { parse: (data: unknown) => T },
    body?: unknown,
  ): Promise<T> {
    const url = `${BASE_URL}${path}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.timeout),
      });

      return this.handleResponse(response, schema);
    } catch (error) {
      if (
        error instanceof ApiError ||
        error instanceof AuthenticationError ||
        error instanceof RateLimitError
      ) {
        throw error;
      }
      throw new NetworkError(
        `Failed to connect to ${url}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async search(
    query: string,
    vertical?: string,
    options?: {
      summarization?: SummarizationConfig | false;
      includeData?: boolean;
      includePlanning?: boolean;
    },
  ): Promise<SearchResult> {
    const body: ApiSearchRequest = {
      query,
      ...(vertical && { vertical_id: vertical }),
    };

    if (options?.summarization !== false && options?.summarization) {
      body.summarization = normalizeSummarization(options.summarization);
    }

    if (options?.includeData !== undefined) {
      body.include_raw_data = options.includeData;
    }

    if (options?.includePlanning !== undefined) {
      body.include_planning = options.includePlanning;
    }

    return this.post("/search", SearchResultSchema, body);
  }

  async createPlan(query: string, vertical?: string): Promise<PlanResponse> {
    const body: ApiPlanRequest = {
      query,
      ...(vertical && { vertical_id: vertical }),
    };

    return this.post("/search/plan", PlanResponseSchema, body);
  }

  async executePlan(
    planId: string,
    options?: {
      summarization?: SummarizationConfig | false;
      includeData?: boolean;
      includePlanning?: boolean;
    },
  ): Promise<SearchResult> {
    const body: ApiPlanRunRequest = {
      plan_id: planId,
    };

    if (options?.summarization !== false && options?.summarization) {
      body.summarization = normalizeSummarization(options.summarization);
    }

    if (options?.includeData !== undefined) {
      body.include_raw_data = options.includeData;
    }

    if (options?.includePlanning !== undefined) {
      body.include_planning = options.includePlanning;
    }

    return this.post("/search/plan/run", SearchResultSchema, body);
  }

  async getTools(verticalId: string): Promise<Tool[]> {
    return this.get("/tools", ToolsResponseSchema, { vertical_id: verticalId });
  }

  async executeTool(
    toolName: string,
    input: unknown,
  ): Promise<ToolExecutionResult> {
    const body: ApiExecuteToolRequest = {
      tool_name: toolName,
      input,
    };

    return this.post("/tools/execute", ToolExecutionResultSchema, body);
  }
}

function normalizeSummarization(config: SummarizationConfig): {
  enable: boolean;
  model: string;
  instruction?: string;
} {
  if (typeof config === "string") {
    return { enable: true, model: config };
  }
  return {
    enable: true,
    model: config.model,
    instruction: config.instruction,
  };
}
