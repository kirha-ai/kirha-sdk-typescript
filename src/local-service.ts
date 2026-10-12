import { Planner, type Tool as PlannerTool } from "@kirha/planner";
import { ApiService } from "./api-service";
import { ConfigurationError, KirhaError } from "./errors";
import type {
  Tool,
  SearchResult,
  LocalSearchOptions,
  LocalTool,
} from "./types";

export interface LocalServiceConfig {
  plannerUrl: string;
  apiKey: string;
  defaultFocus?: string;
  defaultTools?: LocalTool[];
}

export class LocalService {
  private readonly planner: Planner;
  private readonly apiService: ApiService;
  private readonly defaultFocus?: string;
  private readonly defaultTools: LocalTool[];

  constructor(config: LocalServiceConfig) {
    this.planner = new Planner(config.plannerUrl, { apiKey: "unused" });
    this.defaultFocus = config.defaultFocus;
    this.defaultTools = config.defaultTools ?? [];
    this.apiService = new ApiService({
      apiKey: config.apiKey,
    });
  }

  private convertApiToolToPlannerTool(tool: Tool): PlannerTool {
    return {
      name: tool.name,
      description: tool.description,
      inputSchema: JSON.stringify(tool.inputSchema),
      outputSchema: JSON.stringify(tool.outputSchema),
      handler: async (input: unknown) => {
        const result = await this.apiService.executeTool(tool.name, input);
        if (result.isError) {
          throw new KirhaError(
            result.errorMessage ?? `Tool ${tool.name} execution failed`,
          );
        }
        return result.output;
      },
    };
  }

  private convertLocalToolToPlannerTool(tool: LocalTool): PlannerTool {
    return {
      name: tool.name,
      description: tool.description,
      inputSchema: JSON.stringify(tool.inputSchema),
      outputSchema: JSON.stringify(tool.outputSchema),
      handler: tool.handler,
    };
  }

  private async buildPlannerTools(
    focus: string,
    requestTools?: LocalTool[],
  ): Promise<PlannerTool[]> {
    const apiTools = await this.apiService.getTools(focus);

    const localTools = requestTools ?? this.defaultTools;
    const localToolNames = new Set(localTools.map((t) => t.name));

    const plannerTools: PlannerTool[] = [];

    for (const apiTool of apiTools) {
      if (!localToolNames.has(apiTool.name)) {
        plannerTools.push(this.convertApiToolToPlannerTool(apiTool));
      }
    }

    for (const localTool of localTools) {
      plannerTools.push(this.convertLocalToolToPlannerTool(localTool));
    }

    return plannerTools;
  }

  async search(
    query: string,
    options?: LocalSearchOptions,
  ): Promise<SearchResult> {
    const focus = options?.focus ?? this.defaultFocus;

    if (!focus) {
      throw new ConfigurationError("focus is required for local planning mode");
    }

    const plannerTools = await this.buildPlannerTools(focus, options?.tools);

    if (plannerTools.length === 0) {
      throw new ConfigurationError(`No tools available for focus "${focus}"`);
    }

    const plan = await this.planner.generatePlan(query, {
      tools: plannerTools,
      temperature: 0.2,
      maxTokens: 20_000,
    });

    if (!plan) {
      return {
        summary: undefined,
        data: undefined,
      };
    }

    const results = await plan.execute({ tools: plannerTools });

    return {
      data: results,
      planning: {
        status: "success",
        steps: plan.steps.map((step, index) => ({
          id: `local-${index}`,
          toolName: step.toolName,
          parameters: step.arguments as Record<string, unknown>,
        })),
      },
    };
  }
}
