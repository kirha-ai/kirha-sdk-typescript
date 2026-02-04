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
  defaultVertical?: string;
  defaultTools?: LocalTool[];
}

export class LocalService {
  private readonly planner: Planner;
  private readonly apiService: ApiService;
  private readonly defaultVertical?: string;
  private readonly defaultTools: LocalTool[];

  constructor(config: LocalServiceConfig) {
    this.planner = new Planner(config.plannerUrl, {});
    this.defaultVertical = config.defaultVertical;
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
    vertical: string,
    requestTools?: LocalTool[],
  ): Promise<PlannerTool[]> {
    const apiTools = await this.apiService.getTools(vertical);

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
    const vertical = options?.vertical ?? this.defaultVertical;

    if (!vertical) {
      throw new ConfigurationError(
        "vertical is required for local planning mode",
      );
    }

    const plannerTools = await this.buildPlannerTools(vertical, options?.tools);

    if (plannerTools.length === 0) {
      throw new ConfigurationError(
        `No tools available for vertical "${vertical}"`,
      );
    }

    const plan = await this.planner.generatePlan(query, {
      tools: plannerTools,
    });

    if (!plan) {
      return {
        summary: undefined,
        rawData: undefined,
      };
    }

    const results = await plan.execute({ tools: plannerTools });

    return {
      rawData: results,
      planning: {
        planId: "local",
        steps: plan.steps.map((step) => ({
          toolName: step.toolName,
          arguments: step.arguments as Record<string, unknown>,
        })),
      },
    };
  }
}
