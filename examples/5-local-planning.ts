// Local planning: run the planner locally while executing tools via Kirha API when needed.
// Requires @kirha/planner running locally (see docs/local-mode.md).

import { Kirha } from "../src";

if (!process.env.KIRHA_API_KEY) {
  console.error("KIRHA_API_KEY is required");
  process.exit(1);
}

const kirha = new Kirha({
  apiKey: process.env.KIRHA_API_KEY,
  planner: "http://localhost:8080/v1",
  vertical: "crypto",
});

const result = await kirha.search("What is the profit and loss of the largest USDC holder on Base?");

console.log(result.rawData);
