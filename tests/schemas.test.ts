import { describe, it, expect } from "bun:test";
import { ToolsResponseSchema, ToolDetailsSchema } from "../src/schemas";

const tool = {
  id: "tool-1",
  name: "coingecko_get_price",
  provider: "coingecko",
  description: "Get price",
  credits_per_call: 3,
  input_schema: { type: "object" },
  output_schema: { type: "object" },
};

describe("ToolsResponseSchema", () => {
  it("should parse the pagination envelope", () => {
    const result = ToolsResponseSchema.parse({
      tools: [tool],
      total: 416,
      limit: 20,
      skip: 40,
    });

    expect(result.total).toBe(416);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(40);
    expect(result.tools[0]?.provider).toBe("coingecko");
    expect(result.tools[0]?.creditsPerCall).toBe(3);
    expect(result.tools[0]?.inputSchema).toEqual({ type: "object" });
  });

  it("should reject a bare array", () => {
    expect(() => ToolsResponseSchema.parse([])).toThrow();
  });
});

describe("ToolDetailsSchema", () => {
  it("should parse a tool without an envelope", () => {
    const result = ToolDetailsSchema.parse({
      ...tool,
      related_tools: ["coingecko_get_market_chart"],
    });

    expect(result.name).toBe("coingecko_get_price");
    expect(result.relatedTools).toEqual(["coingecko_get_market_chart"]);
    expect(result.related).toBe(false);
  });
});
