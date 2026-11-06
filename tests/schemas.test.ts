import { describe, it, expect } from "bun:test";
import { ToolsResponseSchema } from "../src/schemas";

describe("ToolsResponseSchema", () => {
  it("should parse the pagination envelope", () => {
    const result = ToolsResponseSchema.parse({
      tools: [
        {
          id: "tool-1",
          name: "get_price",
          description: "Get price",
          input_schema: { type: "object" },
          output_schema: { type: "object" },
        },
      ],
      total: 416,
      limit: 20,
      skip: 40,
    });

    expect(result.total).toBe(416);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(40);
    expect(result.tools[0]?.inputSchema).toEqual({ type: "object" });
  });

  it("should reject a bare array", () => {
    expect(() => ToolsResponseSchema.parse([])).toThrow();
  });
});
