// Basic search: execute a query and get raw data.
// Returns the raw tool execution results.

import { Kirha } from "../src";

if (!process.env.KIRHA_API_KEY) {
  console.error("KIRHA_API_KEY is required");
  process.exit(1);
}

const kirha = new Kirha({ apiKey: process.env.KIRHA_API_KEY });

const result = await kirha.search("What is the profit and loss of the largest USDC holder on Base?", {
  vertical: "crypto",
});

console.log(result.data);
