import type { ApiService } from "./api-service";
import type {
  SearchResult,
  PlanExecuteOptions,
  PlanResponse,
  PlanStepResponse,
  PlanUsage,
  PlanAccount,
  SummarizationConfig,
} from "./types";

export class Plan {
  private readonly apiService: ApiService;
  private readonly defaultSummarization?: SummarizationConfig;

  public readonly id: string;
  public readonly query: string;
  public readonly vertical?: string;
  public readonly status: string;
  public readonly steps: PlanStepResponse[];
  public readonly reason?: string;
  public readonly usage: PlanUsage;
  public readonly account?: PlanAccount;

  constructor(
    apiService: ApiService,
    response: PlanResponse,
    query: string,
    vertical?: string,
    defaultSummarization?: SummarizationConfig,
  ) {
    this.apiService = apiService;
    this.defaultSummarization = defaultSummarization;

    this.id = response.id;
    this.query = query;
    this.vertical = vertical;
    this.status = response.status;
    this.steps = response.steps;
    this.reason = response.reason;
    this.usage = response.usage;
    this.account = response.account;
  }

  async execute(options?: PlanExecuteOptions): Promise<SearchResult> {
    const summarization = options?.summarization ?? this.defaultSummarization;

    return this.apiService.executePlan(this.id, {
      summarization,
      includeData: options?.includeData,
      includePlanning: options?.includePlanning,
    });
  }

  // No GET /search/plan/{id} endpoint exists, so we stub every field except
  // `id`. Only `execute()` is meaningful on the returned instance — use
  // `kirha.plan(query)` if you need to inspect steps/usage/status.
  static fromId(
    apiService: ApiService,
    id: string,
    defaultSummarization?: SummarizationConfig,
  ): Plan {
    return new Plan(
      apiService,
      {
        id,
        status: "unknown",
        steps: [],
        usage: { estimated: 0, consumed: 0 },
      },
      "",
      undefined,
      defaultSummarization,
    );
  }
}
