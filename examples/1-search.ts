// Basic search: execute a query and get raw data.
// Returns the raw tool execution results.

import { Kirha } from "../src";

if (!process.env.KIRHA_API_KEY) {
  console.error("KIRHA_API_KEY is required");
  process.exit(1);
}

const kirha = new Kirha({ apiKey: process.env.KIRHA_API_KEY });

const result = await kirha.search("How to stream AI responses in Next.js using the latest AI SDK?");

console.log(result.data);
