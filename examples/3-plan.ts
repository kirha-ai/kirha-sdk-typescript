// Plan mode: preview the execution plan before running it.
// Useful to see estimated usage and steps before committing to execution.

import { Kirha } from "../src";

if (!process.env.KIRHA_API_KEY) {
  console.error("KIRHA_API_KEY is required");
  process.exit(1);
}

const kirha = new Kirha({ apiKey: process.env.KIRHA_API_KEY });

const plan = await kirha.plan("Find engineers working at companies behind the latest patents in Machine Learning");

console.log("Plan ID:", plan.id);
console.log("Steps:", plan.steps);
console.log("Estimated usage:", plan.usage.estimated);

const result = await plan.execute();
console.log(result.data);
