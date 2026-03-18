// Async tasks: manual polling with status getters

import { Kirha } from "../src";

if (!process.env.KIRHA_API_KEY) {
  console.error("KIRHA_API_KEY is required");
  process.exit(1);
}

const kirha = new Kirha({ apiKey: process.env.KIRHA_API_KEY });

const task = await kirha.task(
  "Compare the AI strategies of Google, Microsoft, and Meta: key acquisitions, patent filings, and recent product launches",
  { instruction: "Focus on 2024-2025 developments" }
);

console.log("Task created:", task.id);

while (true) {
  await task.status();

  if (task.isCompleted) {
    const result = await task.result();
    console.log("Result:", result.result);
    break;
  }

  if (task.isFailed) {
    const result = await task.result();
    console.log("Error:", result.error);
    break;
  }

  console.log("Status:", task.isQueued ? "Queued" : task.isResearching ? "Researching" : task.isValidating ? "Validating" : "Summarizing");
  await new Promise((r) => setTimeout(r, 3_000));
}
