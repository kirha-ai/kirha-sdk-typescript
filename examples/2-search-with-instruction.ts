// Search with custom summarization instruction.
// Customize how the response is formatted (e.g., as a table, bullet points, etc.).

import { Kirha } from "../src";

if (!process.env.KIRHA_API_KEY) {
  console.error("KIRHA_API_KEY is required");
  process.exit(1);
}

const kirha = new Kirha({ apiKey: process.env.KIRHA_API_KEY });

const result = await kirha.search("What is the profit and loss of the largest USDC holder on Base?", {
  vertical: "crypto",
  summarization: {
    model: "kirha-flash",
    instruction: "Format the response as a table",
  },
});

console.log(result.summary);
