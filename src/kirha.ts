import { ApiService } from "./api-service";
import { LocalService } from "./local-service";
import { Plan } from "./plan";
import { ConfigurationError, ValidationError } from "./errors";
import type {
  KirhaApiConfig,
  KirhaLocalConfig,
  SearchOptions,
  LocalSearchOptions,
  PlanOptions,
  SearchResult,
  Tool,
  ToolsOptions,
  ToolExecutionResult,
  SummarizationConfig,
} from "./types";

export class KirhaApi {
  private readonly apiService: ApiService;
  private readonly defaultVertical?: string;
  private readonly defaultSummarization?: SummarizationConfig;

  constructor(config: KirhaApiConfig) {
    if (!config.apiKey) {
      throw new ConfigurationError("apiKey is required");
    }

    this.apiService = new ApiService({
      apiKey: config.apiKey,
    });
    this.defaultVertical = config.vertical;
    this.defaultSummarization = config.summarization;
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult> {
    const vertical = options?.vertical ?? this.defaultVertical;

    if (!vertical) {
      throw new ValidationError("vertical is required", "vertical");
    }

    const summarization = options?.summarization ?? this.defaultSummarization;

    return this.apiService.search(query, vertical, {
      summarization,
      includeRawData: options?.includeRawData,
      includePlanning: options?.includePlanning,
    });
  }

  async plan(query: string, options?: PlanOptions): Promise<Plan> {
    const vertical = options?.vertical ?? this.defaultVertical;

    if (!vertical) {
      throw new ValidationError("vertical is required", "vertical");
    }

    const response = await this.apiService.createPlan(query, vertical);

    return new Plan(
      this.apiService,
      response,
      query,
      vertical,
      options?.summarization ?? this.defaultSummarization,
    );
  }

  async tools(options: ToolsOptions): Promise<Tool[]> {
    return this.apiService.getTools(options.vertical);
  }

  async executeTool(
    toolName: string,
    input: unknown,
  ): Promise<ToolExecutionResult> {
    return this.apiService.executeTool(toolName, input);
  }
}

export class KirhaLocal {
  private readonly localService: LocalService;

  constructor(config: KirhaLocalConfig) {
    if (!config.apiKey) {
      throw new ConfigurationError("apiKey is required");
    }

    if (!config.planner) {
      throw new ConfigurationError("planner URL is required for local mode");
    }

    this.localService = new LocalService({
      plannerUrl: config.planner,
      apiKey: config.apiKey,
      defaultVertical: config.vertical,
      defaultTools: config.tools,
    });
  }

  async search(
    query: string,
    options?: LocalSearchOptions,
  ): Promise<SearchResult> {
    return this.localService.search(query, options);
  }
}

interface KirhaConstructor {
  new (config: KirhaApiConfig): KirhaApi;
  new (config: KirhaLocalConfig): KirhaLocal;
}

function KirhaFactory(
  this: unknown,
  config: KirhaApiConfig | KirhaLocalConfig,
): KirhaApi | KirhaLocal {
  if ("planner" in config && config.planner) {
    return new KirhaLocal(config as KirhaLocalConfig);
  }
  return new KirhaApi(config as KirhaApiConfig);
}

export const Kirha = KirhaFactory as unknown as KirhaConstructor;
