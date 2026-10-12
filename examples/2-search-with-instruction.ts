// Search with custom summarization instruction.
// Customize how the response is formatted (e.g., as a table, bullet points, etc.).

import { Kirha } from "../src";

if (!process.env.KIRHA_API_KEY) {
  console.error("KIRHA_API_KEY is required");
  process.exit(1);
}

const kirha = new Kirha({ apiKey: process.env.KIRHA_API_KEY });

const result = await kirha.search("List top 10 stablecoins yield on Ethereum", {
  summarization: {
    instruction: "Format the response as a table",
  },
});

console.log(result.summary);
