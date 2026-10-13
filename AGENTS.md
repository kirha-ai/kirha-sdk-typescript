# AGENTS.md

`kirha` on npm: the TypeScript SDK for the KIRHA API. KIRHA gives AI agents live, sourced data from specialized providers, with web search as fallback.

- Get an API key: https://app.kirha.com/api-keys
- SDK docs: https://docs.kirha.com/sdk.mdx
- Full docs for agents: https://docs.kirha.com/llms-full.txt

```ts
import { Kirha } from "kirha";

const kirha = new Kirha({ apiKey: process.env.KIRHA_API_KEY });
const result = await kirha.search("What does the boxed warning on Ozempic say?");
```

- `focus` is optional. Leave it out unless results are thin, then pick a vertical from https://docs.kirha.com/verticals.mdx.
- `plan()` returns the steps and the cost before anything is charged. `plan.execute()` runs it, and throws `PlanExpiredError` once the plan has expired.
