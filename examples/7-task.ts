// Async tasks: wait for completion with automatic polling

import { Kirha, TaskStatus } from "../src";

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

const result = await task.wait({ pollInterval: 3_000 });

if (result.status === TaskStatus.Completed) {
  console.log("Result:", result.result);
} else {
  console.log("Error:", result.error);
}
