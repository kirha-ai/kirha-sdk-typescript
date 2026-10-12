<p align="center">
  <img src="./assets/banner.png" alt="KIRHA SDK" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/kirha"><img src="https://img.shields.io/npm/v/kirha" alt="npm version" /></a>
  <a href="https://github.com/kirha-ai/kirha-sdk-typescript/actions/workflows/ci.yml"><img src="https://github.com/kirha-ai/kirha-sdk-typescript/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/kirha"><img src="https://img.shields.io/npm/dm/kirha" alt="npm downloads" /></a>
</p>

<p align="center">
  <a href="https://kirha.com"><b>🦋 KIRHA</b></a> •
  <a href="https://docs.kirha.com"><b>📚 Documentation</b></a> •
  <a href="https://app.kirha.com/auth/register"><b>🔑 Get an API key</b></a>
</p>

# KIRHA SDK

TypeScript SDK for the KIRHA API.

## Installation

```bash
npm install kirha
# or 
pnpm install kirha
# or 
yarn add kirha
# or
bun add kirha
```

## Quick Start

```typescript
import { Kirha } from "kirha";

const kirha = new Kirha({ apiKey: process.env.KIRHA_API_KEY });

const result = await kirha.search("What does the boxed warning on Ozempic say?");

console.log(result.data);
```

## Examples

### Summarization

```typescript
const kirha = new Kirha({ apiKey: "your-api-key" });

const result = await kirha.search("Summarize latest NVIDIA earning calls", {
  summarization: true,
});

console.log(result.summary);
```

### Summarization with instruction

```typescript
const kirha = new Kirha({ apiKey: "your-api-key" });

const result = await kirha.search("List top 10 stablecoins yield on Ethereum", {
  summarization: {
    instruction: "Format the response as a table with columns: Stablecoin, Protocol, APY",
  },
});

console.log(result.summary);
```

### Plan mode

```typescript
const kirha = new Kirha({ apiKey: "your-api-key" });

const plan = await kirha.plan(
  "Find engineers working at companies behind the latest patents in Machine Learning",
);

// Review plan (Human in the loop or agent validation)
console.log(plan.steps);
console.log(plan.usage);

const result = await plan.execute();
console.log(result.data);
```

### Direct tool calling

```typescript
const tools = await kirha.tools({ focus: "crypto" });
console.log(tools.map(t => t.name));

const result = await kirha.executeTool("zerion_getEthereumWalletProfitAndLoss", {
  currency: "usd",
  ethereumAddress: "0xbbbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb",
});
```

### Local planning with KIRHA tools

```typescript
import { Kirha } from "kirha";

const kirha = new Kirha({
  apiKey: "your-api-key",
  planner: "http://localhost:8080/v1", // any OpenAI completion api endpoint running our open source kirha/planner model
  focus: "crypto",
});

const result = await kirha.search("What is the profit and loss of the largest USDC holder on Base?");
console.log(result.data);
```

## Documentation

- [Search API](./docs/search-api.md) - Full API reference
- [Local planning](./docs/local-planning.md) - Local planning with hybrid tools

## Errors

| Error | Description |
|-------|-------------|
| `KirhaError` | Base error class |
| `ConfigurationError` | Invalid SDK configuration |
| `ApiError` | API returned an error |
| `AuthenticationError` | Invalid or missing API key (401) |
| `RateLimitError` | Rate limit exceeded (429) |
| `ValidationError` | Invalid input parameters |
| `PlanExpiredError` | Plan expired (5 minute limit) |
| `NetworkError` | Network/connection failure |

## License

MIT
