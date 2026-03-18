<p align="center">
  <img src="./assets/banner.png" alt="Kirha SDK" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/kirha"><img src="https://img.shields.io/npm/v/kirha" alt="npm version" /></a>
  <a href="https://github.com/kirha-ai/kirha-sdk-typescript/actions/workflows/ci.yml"><img src="https://github.com/kirha-ai/kirha-sdk-typescript/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/kirha"><img src="https://img.shields.io/npm/dm/kirha" alt="npm downloads" /></a>
</p>

<p align="center">
  <a href="https://kirha.com"><b>🦋 Kirha</b></a> •
  <a href="https://docs.kirha.com"><b>📚 Documentation</b></a> •
  <a href="https://app.kirha.com/auth/register"><b>🔑 Get an API key</b></a>
</p>

# Kirha SDK

TypeScript SDK for the Kirha API.

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

const kirha = new Kirha({
  apiKey: process.env.KIRHA_API_KEY,
  vertical: "crypto",
});

const result = await kirha.search("What is the profit and loss of the largest USDC holder on Base?");

console.log(result.data);
```

## Examples

### Summarization

```typescript
const kirha = new Kirha({ apiKey: "your-api-key" });

const result = await kirha.search("What is the profit and loss of the largest USDC holder on Base?", {
  vertical: "crypto",
  summarization: "kirha-flash",
});

console.log(result.summary);
```

### Summarization with instruction

```typescript
const kirha = new Kirha({ apiKey: "your-api-key" });

const result = await kirha.search("What is the profit and loss of the largest USDC holder on Base?", {
  vertical: "crypto",
  summarization: {
    model: "kirha-flash",
    instruction: "Format the response as a table with columns: Address, PnL, Percentage",
  },
});

console.log(result.summary);
```

### Plan mode

```typescript
const kirha = new Kirha({ apiKey: "your-api-key" });

const plan = await kirha.plan("Compare trading volumes on Ethereum vs Base network", {
  vertical: "crypto",
});

// Review plan (Human in the loop or agent validation)
console.log(plan.steps);
console.log(plan.usage);

const result = await plan.execute();
console.log(result.data);
```

### Direct tool calling

```typescript
const tools = await kirha.tools({ vertical: "crypto" });
console.log(tools.map(t => t.name));

const result = await kirha.executeTool("zerion_getEthereumWalletProfitAndLoss", {
  currency: "usd",
  ethereumAddress: "0xbbbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb",
});
```

### Tasks

```typescript
const kirha = new Kirha({ apiKey: "your-api-key" });

const task = await kirha.task("Compare the AI strategies of Google, Microsoft, and Meta: key acquisitions, patent filings, and recent product launches");
const result = await task.wait();

console.log(result.result);
```

### Local planning with Kirha tools

```typescript
import { Kirha } from "kirha";

const kirha = new Kirha({
  apiKey: "your-api-key",
  planner: "http://localhost:8080/v1", // any OpenAI completion api endpoint running our open source kirha/planner model
  vertical: "crypto",
});

const result = await kirha.search("What is the profit and loss of the largest USDC holder on Base?");
console.log(result.data);
```

## Documentation

- [API Mode](./docs/api-mode.md) - Full API reference
- [Local Mode](./docs/local-mode.md) - Local planning with hybrid tools
- [Tasks](./docs/tasks.md) - Async tasks with polling

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
