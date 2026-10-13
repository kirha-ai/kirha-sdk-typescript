# AGENTS.md

`kirha` on npm: the TypeScript SDK for the KIRHA API. KIRHA gives AI agents live, sourced data from specialized providers, with web search as fallback.

## Using the SDK

```ts
import { Kirha } from "kirha";

const kirha = new Kirha({ apiKey: process.env.KIRHA_API_KEY });
const result = await kirha.search("What does the boxed warning on Ozempic say?");
```

- Get a key at https://app.kirha.com/api-keys.
- `focus` is optional. Leave it out unless results are thin, then pick a vertical from https://docs.kirha.com/verticals.
- `plan()` returns the steps and the cost before anything is charged. `plan.execute()` runs it, and throws `PlanExpiredError` once the plan has expired.
- Full reference for agents: https://docs.kirha.com/llms-full.txt

## Working on this repo

- Bun 1.4.3 (see `.tool-versions`), TypeScript 7, Biome.
- `bun install`, then `bun test`, `bun run build`, `bun run lint`. CI runs the same three and `biome ci .`.
- `src/kirha.ts` is the public client, `src/api-service.ts` calls the KIRHA API, `src/local-service.ts` runs plans with a local planner model. Zod schemas for API responses live in `src/schemas.ts`.
- Anything exported from `src/index.ts` is public API. Keep it backward compatible or bump the minor version.
- Tests in `tests/` must not call the real API. `tests/api-service.test.ts` shows how to mock `fetch`.
- Publishing: bump `version` in `package.json`, then create a GitHub release. The release workflow publishes to npm.
