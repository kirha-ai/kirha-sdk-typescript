import { describe, it, expect, beforeAll, setDefaultTimeout } from "bun:test";

setDefaultTimeout(120_000);

import { Kirha, type KirhaApi } from "../src";

const API_KEY = process.env.KIRHA_API_KEY;

describe.skipIf(!API_KEY)("Integration Tests (requires KIRHA_API_KEY)", () => {
  let kirha: KirhaApi;

  beforeAll(() => {
    if (!API_KEY) {
      throw new Error("KIRHA_API_KEY is not set");
    }

    kirha = new Kirha({ apiKey: API_KEY });
  });

  describe("search()", () => {
    it("should perform a basic search", async () => {
      const result = await kirha.search("What is the current Bitcoin price?", {
        vertical: "crypto",
      });

      expect(result).toBeDefined();
      expect(result.summary).toBeUndefined();
    });

    it("should return data when requested", async () => {
      const result = await kirha.search("Bitcoin price", {
        vertical: "crypto",
        includeData: true,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it("should return planning info when requested", async () => {
      const result = await kirha.search("Bitcoin price", {
        vertical: "crypto",
        includePlanning: true,
      });

      expect(result).toBeDefined();
      expect(result.planning).toBeDefined();
      expect(result.planning?.status).toBeDefined();
    });

    it("should work with custom summarization model", async () => {
      const result = await kirha.search("Ethereum price", {
        vertical: "crypto",
        summarization: "kirha-flash",
      });

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it("should work with summarization instruction", async () => {
      const result = await kirha.search("Bitcoin price", {
        vertical: "crypto",
        summarization: {
          model: "kirha",
          instruction: "Respond in French",
        },
      });

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it("should search without vertical", async () => {
      const result = await kirha.search("What is the current Bitcoin price?");

      expect(result).toBeDefined();
    });

    it("should skip summarization when disabled", async () => {
      const result = await kirha.search("Bitcoin price", {
        vertical: "crypto",
        summarization: false,
        includeData: true,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe("plan()", () => {
    it("should create a plan", async () => {
      const plan = await kirha.plan("What is the current Bitcoin price?", {
        vertical: "crypto",
      });

      expect(plan).toBeDefined();
      expect(plan.id).toBeDefined();
      expect(typeof plan.id).toBe("string");
      expect(plan.steps).toBeDefined();
      expect(Array.isArray(plan.steps)).toBe(true);
    });

    it("should execute a plan", async () => {
      const plan = await kirha.plan("Bitcoin price", {
        vertical: "crypto",
      });

      expect(plan.id).toBeDefined();

      const result = await plan.execute();

      expect(result).toBeDefined();
    });

    it("should create a plan without vertical", async () => {
      const plan = await kirha.plan("What is the current Bitcoin price?");

      expect(plan).toBeDefined();
      expect(plan.id).toBeDefined();
      expect(plan.steps).toBeDefined();
    });

    it("should execute a plan with options", async () => {
      const plan = await kirha.plan("Ethereum market data", {
        vertical: "crypto",
      });

      const result = await plan.execute({
        includeData: true,
        includePlanning: true,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.planning).toBeDefined();
    });
  });

  describe("tools()", () => {
    it("should list available tools for a vertical", async () => {
      const tools = await kirha.tools({ vertical: "crypto" });

      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);

      const firstTool = tools[0];
      expect(firstTool?.id).toBeDefined();
      expect(firstTool?.name).toBeDefined();
      expect(firstTool?.description).toBeDefined();
      expect(firstTool?.inputSchema).toBeDefined();
    });
  });

  describe("default vertical", () => {
    it("should use default vertical from config", async () => {
      if (!API_KEY) {
        throw new Error("KIRHA_API_KEY is not set");
      }

      const kirhaWithVertical = new Kirha({
        apiKey: API_KEY,
        vertical: "crypto",
      });

      const result = await kirhaWithVertical.search("Bitcoin price");

      expect(result).toBeDefined();
    });
  });

  describe("usage and account info", () => {
    it("should return usage information", async () => {
      const result = await kirha.search("Bitcoin price", {
        vertical: "crypto",
      });

      expect(result.usage).toBeDefined();
      if (result.usage) {
        expect(typeof result.usage.estimated).toBe("number");
        expect(typeof result.usage.consumed).toBe("number");
      }
    });

    it("should return account information", async () => {
      const result = await kirha.search("Bitcoin price", {
        vertical: "crypto",
      });

      expect(result.account).toBeDefined();
      if (result.account) {
        expect(typeof result.account.balance).toBe("number");
        expect(result.account.balanceTimestamp).toBeDefined();
      }
    });
  });
});
