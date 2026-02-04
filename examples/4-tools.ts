// Direct tool calling: list available tools and execute one directly.
// Bypass the planner and call a specific tool with your own parameters.

import { Kirha } from "../src";

if (!process.env.KIRHA_API_KEY) {
  console.error("KIRHA_API_KEY is required");
  process.exit(1);
}

const kirha = new Kirha({ apiKey: process.env.KIRHA_API_KEY });

const tools = await kirha.tools({ vertical: "crypto" });
console.log(tools.map(t => t.name));

const result = await kirha.executeTool("zerion_getEthereumWalletProfitAndLoss", {
  currency: "usd",
  ethereumAddress: "0xbbbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb",
});

console.log(result.output);
