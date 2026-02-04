// Local planning with custom tools: combine Kirha API tools with your own local tools.
// The planner will orchestrate both Kirha tools (e.g., Zerion) and your custom handlers.

import { Kirha, type LocalTool } from "../src";

if (!process.env.KIRHA_API_KEY) {
  console.error("KIRHA_API_KEY is required");
  process.exit(1);
}

const customTools: LocalTool[] = [
  {
    name: "save_to_database",
    description: "Save portfolio data to the local database",
    inputSchema: {
      type: "object",
      properties: {
        walletAddress: { type: "string" },
        data: { type: "object" },
      },
      required: ["walletAddress", "data"],
    },
    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        id: { type: "string" },
      },
    },
    handler: async (input: { walletAddress: string; data: unknown }) => {
      console.log(`Saving data for ${input.walletAddress}:`, input.data);
      return { success: true, id: crypto.randomUUID() };
    },
  },
];

const kirha = new Kirha({
  apiKey: process.env.KIRHA_API_KEY,
  planner: "http://localhost:8080/v1",
  vertical: "crypto",
  tools: customTools,
});

const result = await kirha.search(
  "Get the portfolio of 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 and save it to the database"
);

console.log(result.rawData);
