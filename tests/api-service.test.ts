import { describe, it, expect, mock, afterEach } from "bun:test";
import { ApiService } from "../src/api-service";
import {
  ApiError,
  AuthenticationError,
  PlanExpiredError,
  RateLimitError,
} from "../src/errors";
import { PlanningRuntime } from "../src/types";

type MockFetch = ReturnType<
  typeof mock<(url: string, options: RequestInit) => Promise<Response>>
>;

describe("ApiService", () => {
  const originalFetch = globalThis.fetch;
  let mockFn: MockFetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetch(response: {
    ok: boolean;
    status: number;
    statusText?: string;
    json: () => Promise<unknown>;
    headers?: Headers;
  }) {
    mockFn = mock(() =>
      Promise.resolve({
        ok: response.ok,
        status: response.status,
        statusText: response.statusText ?? "OK",
        json: response.json,
        headers: response.headers ?? new Headers(),
      } as Response),
    );
    globalThis.fetch = mockFn as unknown as typeof fetch;
  }

  describe("search", () => {
    it("should call POST /search with correct body", async () => {
      const mockResponse = {
        summary: "Bitcoin is at $50,000",
        raw_data: { price: 50000 },
      };

      mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const service = new ApiService({ apiKey: "test-key" });
      const result = await service.search("bitcoin price", "crypto");

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFn.mock.calls[0] as [string, RequestInit];

      expect(url).toBe("https://api.kirha.com/chat/v1/search");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body as string)).toEqual({
        query: "bitcoin price",
        focus: "crypto",
      });
      expect(result.summary).toBe("Bitcoin is at $50,000");
      expect(result.data).toEqual({ price: 50000 });
    });

    it("should include summarization when provided", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      const service = new ApiService({ apiKey: "test-key" });
      await service.search("query", "crypto", {
        summarization: { instruction: "Be brief" },
      });

      const [, options] = mockFn.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.summarization).toEqual({
        enable: true,
        instruction: "Be brief",
      });
    });

    it("should include planning_runtime when provided", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      const service = new ApiService({ apiKey: "test-key" });
      await service.search("query", "crypto", {
        planningRuntime: PlanningRuntime.Fast,
      });

      const [, options] = mockFn.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.planning_runtime).toBe("fast");
    });

    it("should enable summarization with true", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      const service = new ApiService({ apiKey: "test-key" });
      await service.search("query", "crypto", {
        summarization: true,
      });

      const [, options] = mockFn.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.summarization).toEqual({ enable: true });
    });
  });

  describe("createPlan", () => {
    it("should call POST /search/plan", async () => {
      const mockResponse = {
        id: "plan-123",
        status: "pending_confirmation",
        steps: [
          {
            id: "step-1",
            tool_name: "get_price",
            parameters: { symbol: "BTC" },
            reasoning: "Get the current price",
          },
        ],
        reason: "Need to fetch price data",
        usage: { estimated: 10, consumed: 0 },
        account: { balance: 100, balance_timestamp: "2024-01-01T00:00:00Z" },
      };

      mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const service = new ApiService({ apiKey: "test-key" });
      const result = await service.createPlan("query", "crypto");

      const [url, options] = mockFn.mock.calls[0] as [string, RequestInit];

      expect(url).toBe("https://api.kirha.com/chat/v1/search/plan");
      expect(JSON.parse(options.body as string)).toEqual({
        query: "query",
        focus: "crypto",
      });
      expect(result.id).toBe("plan-123");
      expect(result.status).toBe("pending_confirmation");
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0]?.toolName).toBe("get_price");
      expect(result.usage.estimated).toBe(10);
      expect(result.account?.balance).toBe(100);
    });

    it("should include planning_runtime when provided", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: "search_1",
            status: "pending_confirmation",
            steps: [],
            usage: { estimated: 0, consumed: 0 },
          }),
      });

      const service = new ApiService({ apiKey: "test-key" });
      await service.createPlan("query", undefined, PlanningRuntime.Fast);

      const [, options] = mockFn.mock.calls[0] as [string, RequestInit];

      expect(JSON.parse(options.body as string)).toEqual({
        query: "query",
        planning_runtime: "fast",
      });
    });
  });

  describe("executePlan", () => {
    it("should call POST /search/plan/run with the plan id", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ summary: "result" }),
      });

      const service = new ApiService({ apiKey: "test-key" });
      await service.executePlan("plan-123");

      const [url, options] = mockFn.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(url).toBe("https://api.kirha.com/chat/v1/search/plan/run");
      expect(body).toEqual({ id: "plan-123" });
    });

    it("should throw PlanExpiredError when the plan has expired", async () => {
      mockFetch({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            type: "CONVERSATION_TURN_TIMEOUT",
            reason: "Plan expired.",
          }),
      });

      const service = new ApiService({ apiKey: "test-key" });

      await expect(service.executePlan("plan-123")).rejects.toThrow(
        PlanExpiredError,
      );
    });
  });

  describe("getTools", () => {
    const mockTool = {
      id: "tool-1",
      name: "coingecko_get_price",
      provider: "coingecko",
      description: "Get price",
      credits_per_call: 3,
      input_schema: { type: "object" },
      output_schema: { type: "object" },
    };

    it("should call GET /tools with vertical_id query param", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ tools: [mockTool], total: 1, limit: 1, skip: 0 }),
      });

      const service = new ApiService({ apiKey: "test-key" });
      const result = await service.getTools({ focus: "crypto" });

      const [url, options] = mockFn.mock.calls[0] as [string, RequestInit];

      expect(url).toBe(
        "https://api.kirha.com/chat/v1/tools?vertical_id=crypto",
      );
      expect(options.method).toBe("GET");
      expect(result.tools[0]?.name).toBe("coingecko_get_price");
      expect(result.tools[0]?.provider).toBe("coingecko");
      expect(result.tools[0]?.creditsPerCall).toBe(3);
      expect(result.tools[0]?.inputSchema).toEqual({ type: "object" });
    });

    it("should return the pagination window", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            tools: [mockTool],
            total: 416,
            limit: 20,
            skip: 40,
          }),
      });

      const service = new ApiService({ apiKey: "test-key" });
      const result = await service.getTools({ focus: "crypto" });

      expect(result.total).toBe(416);
      expect(result.limit).toBe(20);
      expect(result.skip).toBe(40);
      expect(result.tools).toHaveLength(1);
    });

    it("should send the provider and paging filters", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ tools: [], total: 0, limit: 20, skip: 20 }),
      });

      const service = new ApiService({ apiKey: "test-key" });
      await service.getTools({ provider: "coingecko", page: 2, limit: 20 });

      const [url] = mockFn.mock.calls[0] as [string, RequestInit];
      const params = new URL(url).searchParams;

      expect(params.get("provider")).toBe("coingecko");
      expect(params.get("page")).toBe("2");
      expect(params.get("limit")).toBe("20");
      expect(params.has("vertical_id")).toBe(false);
    });

    it("should send no query param without options", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ tools: [], total: 0, limit: 0, skip: 0 }),
      });

      const service = new ApiService({ apiKey: "test-key" });
      await service.getTools();

      const [url] = mockFn.mock.calls[0] as [string, RequestInit];

      expect(url).toBe("https://api.kirha.com/chat/v1/tools");
    });

    it("should accept a tool without input and output schemas", async () => {
      const { input_schema, output_schema, ...bareTool } = mockTool;

      mockFetch({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ tools: [bareTool], total: 1, limit: 1, skip: 0 }),
      });

      const service = new ApiService({ apiKey: "test-key" });
      const result = await service.getTools();

      expect(result.tools[0]?.inputSchema).toBeUndefined();
      expect(result.tools[0]?.outputSchema).toBeUndefined();
    });
  });

  describe("matchTools", () => {
    const rankedTool = {
      id: "tool-1",
      name: "xverse_getTokenHolders",
      provider: "xverse",
      description: "Token holders",
      credits_per_call: 3,
    };

    it("should call GET /tools/match with q, focus and limit", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            tools: [rankedTool],
            total: 1,
            limit: 5,
            skip: 0,
          }),
      });

      const service = new ApiService({ apiKey: "test-key" });
      const result = await service.matchTools("who holds this token", {
        focus: "crypto",
        limit: 5,
      });

      const [url, options] = mockFn.mock.calls[0] as [string, RequestInit];
      const target = new URL(url);

      expect(target.pathname).toBe("/chat/v1/tools/match");
      expect(target.searchParams.get("q")).toBe("who holds this token");
      expect(target.searchParams.get("focus")).toBe("crypto");
      expect(target.searchParams.get("limit")).toBe("5");
      expect(options.method).toBe("GET");
      expect(result.limit).toBe(5);
      expect(result.tools[0]?.related).toBe(false);
      expect(result.tools[0]?.relatedTo).toEqual([]);
    });

    it("should read related and related_to on expanded tools", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            tools: [
              rankedTool,
              {
                ...rankedTool,
                id: "tool-2",
                name: "xverse_getSparkTokenHolders",
                related: true,
                related_to: ["xverse_getTokenHolders"],
              },
            ],
            total: 2,
            limit: 10,
            skip: 0,
          }),
      });

      const service = new ApiService({ apiKey: "test-key" });
      const result = await service.matchTools("who holds this token");

      expect(result.tools[0]?.related).toBe(false);
      expect(result.tools[1]?.related).toBe(true);
      expect(result.tools[1]?.relatedTo).toEqual(["xverse_getTokenHolders"]);
    });

    it("should accept an empty ranking", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ tools: [], total: 0, limit: 10, skip: 0 }),
      });

      const service = new ApiService({ apiKey: "test-key" });
      const result = await service.matchTools("nothing matches this");

      expect(result.tools).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("getTool", () => {
    it("should call GET /tools/{tool_name} and read related_tools", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: "tool-1",
            name: "pubmed_searchPubmedArticles",
            provider: "pubmed",
            description: "Search articles",
            credits_per_call: 0,
            input_schema: { type: "object" },
            output_schema: { type: "object" },
            related_tools: [
              "pubmed_fetchPubmedArticles",
              "pubmed_lookupMeshTerms",
            ],
          }),
      });

      const service = new ApiService({ apiKey: "test-key" });
      const result = await service.getTool("pubmed_searchPubmedArticles");

      const [url, options] = mockFn.mock.calls[0] as [string, RequestInit];

      expect(url).toBe(
        "https://api.kirha.com/chat/v1/tools/pubmed_searchPubmedArticles",
      );
      expect(options.method).toBe("GET");
      expect(result.name).toBe("pubmed_searchPubmedArticles");
      expect(result.creditsPerCall).toBe(0);
      expect(result.relatedTools).toEqual([
        "pubmed_fetchPubmedArticles",
        "pubmed_lookupMeshTerms",
      ]);
    });

    it("should default related_tools to an empty array", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: "tool-1",
            name: "pubmed_searchPubmedArticles",
            provider: "pubmed",
            description: "Search articles",
            credits_per_call: 0,
          }),
      });

      const service = new ApiService({ apiKey: "test-key" });
      const result = await service.getTool("pubmed_searchPubmedArticles");

      expect(result.relatedTools).toEqual([]);
    });
  });

  describe("executeTool", () => {
    it("should call POST /tools/execute with tool_name and input", async () => {
      const mockResult = {
        tool_name: "get_price",
        output: { price: 50000 },
        is_error: false,
        usage: { estimated: 1, consumed: 1 },
      };

      mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResult),
      });

      const service = new ApiService({ apiKey: "test-key" });
      const result = await service.executeTool("get_price", { symbol: "BTC" });

      const [url, options] = mockFn.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(url).toBe("https://api.kirha.com/chat/v1/tools/execute");
      expect(body).toEqual({
        tool_name: "get_price",
        input: { symbol: "BTC" },
      });
      expect(result.toolName).toBe("get_price");
      expect(result.isError).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should throw AuthenticationError on 401", async () => {
      mockFetch({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            error: { code: "auth_error", message: "Invalid API key" },
          }),
      });

      const service = new ApiService({ apiKey: "bad-key" });

      expect(service.search("query", "crypto")).rejects.toThrow(
        AuthenticationError,
      );
    });

    it("should throw RateLimitError on 429", async () => {
      const headers = new Headers();
      headers.set("Retry-After", "60");

      mockFetch({
        ok: false,
        status: 429,
        headers,
        json: () =>
          Promise.resolve({
            error: { code: "rate_limit", message: "Too many requests" },
          }),
      });

      const service = new ApiService({ apiKey: "test-key" });

      try {
        await service.search("query", "crypto");
      } catch (error) {
        expect(error instanceof RateLimitError).toBe(true);
        expect((error as RateLimitError).retryAfter).toBe(60);
      }
    });

    it("should throw ApiError on other error responses", async () => {
      mockFetch({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: { code: "bad_request", message: "Invalid query" },
          }),
      });

      const service = new ApiService({ apiKey: "test-key" });

      try {
        await service.search("", "crypto");
      } catch (error) {
        expect(error instanceof ApiError).toBe(true);
        expect((error as ApiError).statusCode).toBe(400);
        expect((error as ApiError).code).toBe("bad_request");
      }
    });

    it("should include Authorization header", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      const service = new ApiService({ apiKey: "my-secret-key" });
      await service.search("query", "crypto");

      const [, options] = mockFn.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Headers;

      expect(headers.get("Authorization")).toBe("Bearer my-secret-key");
    });
  });
});
