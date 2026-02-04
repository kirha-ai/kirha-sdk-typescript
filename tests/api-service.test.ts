import { describe, it, expect, mock, afterEach } from "bun:test";
import { ApiService } from "../src/api-service";
import { ApiError, AuthenticationError, RateLimitError } from "../src/errors";

describe("ApiService", () => {
  const originalFetch = globalThis.fetch;

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
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: response.ok,
        status: response.status,
        statusText: response.statusText ?? "OK",
        json: response.json,
        headers: response.headers ?? new Headers(),
      } as Response),
    );
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
      const [url, options] = (globalThis.fetch as ReturnType<typeof mock>).mock
        .calls[0] as [string, RequestInit];

      expect(url).toBe("https://api.kirha.ai/chat/v1/search");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body as string)).toEqual({
        query: "bitcoin price",
        vertical: "crypto",
      });
      expect(result.summary).toBe("Bitcoin is at $50,000");
      expect(result.rawData).toEqual({ price: 50000 });
    });

    it("should include summarization when provided", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      const service = new ApiService({ apiKey: "test-key" });
      await service.search("query", "crypto", {
        summarization: { model: "kirha-flash", instruction: "Be brief" },
      });

      const [, options] = (globalThis.fetch as ReturnType<typeof mock>).mock
        .calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.summarization).toEqual({
        enable: true,
        model: "kirha-flash",
        instruction: "Be brief",
      });
    });

    it("should handle string summarization", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      const service = new ApiService({ apiKey: "test-key" });
      await service.search("query", "crypto", {
        summarization: "kirha",
      });

      const [, options] = (globalThis.fetch as ReturnType<typeof mock>).mock
        .calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.summarization).toEqual({
        enable: true,
        model: "kirha",
      });
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

      const [url] = (globalThis.fetch as ReturnType<typeof mock>).mock
        .calls[0] as [string, RequestInit];

      expect(url).toBe("https://api.kirha.ai/chat/v1/search/plan");
      expect(result.id).toBe("plan-123");
      expect(result.status).toBe("pending_confirmation");
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].toolName).toBe("get_price");
      expect(result.usage.estimated).toBe(10);
      expect(result.account?.balance).toBe(100);
    });
  });

  describe("executePlan", () => {
    it("should call POST /search/plan/run with plan_id", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ summary: "result" }),
      });

      const service = new ApiService({ apiKey: "test-key" });
      await service.executePlan("plan-123");

      const [url, options] = (globalThis.fetch as ReturnType<typeof mock>).mock
        .calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(url).toBe("https://api.kirha.ai/chat/v1/search/plan/run");
      expect(body.plan_id).toBe("plan-123");
    });
  });

  describe("getTools", () => {
    it("should call GET /tools with vertical_id query param", async () => {
      const mockTools = [
        {
          id: "tool-1",
          name: "get_price",
          description: "Get price",
          input_schema: {},
          output_schema: {},
        },
      ];

      mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTools),
      });

      const service = new ApiService({ apiKey: "test-key" });
      const result = await service.getTools("crypto");

      const [url, options] = (globalThis.fetch as ReturnType<typeof mock>).mock
        .calls[0] as [string, RequestInit];

      expect(url).toBe("https://api.kirha.ai/chat/v1/tools?vertical_id=crypto");
      expect(options.method).toBe("GET");
      expect(result[0]?.name).toBe("get_price");
      expect(result[0]?.inputSchema).toEqual({});
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

      const [url, options] = (globalThis.fetch as ReturnType<typeof mock>).mock
        .calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(url).toBe("https://api.kirha.ai/chat/v1/tools/execute");
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

      await expect(service.search("query", "crypto")).rejects.toThrow(
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

      const [, options] = (globalThis.fetch as ReturnType<typeof mock>).mock
        .calls[0] as [string, RequestInit];
      const headers = options.headers as Headers;

      expect(headers.get("Authorization")).toBe("Bearer my-secret-key");
    });
  });
});
