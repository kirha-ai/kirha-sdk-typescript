# Search API

Full access to the Kirha Search API with search, planning, and tool execution.

## Configuration

```typescript
import { Kirha } from "kirha";

const kirha = new Kirha({
  apiKey: "your-api-key",
  vertical: "crypto",
  summarization: "kirha-flash",
});
```

### Constructor Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | `string` | Yes | Your Kirha API key |
| `vertical` | `string` | No | Default vertical for all requests |
| `summarization` | `SummarizationConfig` | No | Default summarization config |

### SummarizationConfig

```typescript
type SummarizationConfig =
  | "kirha"
  | "kirha-flash"
  | { model: "kirha" | "kirha-flash"; instruction?: string };
```

---

## Methods

### `search(query, options?)`

Execute a search query with optional summarization.

```typescript
const result = await kirha.search("Bitcoin price", {
  vertical: "crypto",
  summarization: { model: "kirha-flash", instruction: "Be concise" },
  includeRawData: true,
  includePlanning: true,
});

console.log(result.summary);
console.log(result.usage?.consumed);
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `string` | Yes | The search query |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `vertical` | `string` | Constructor default | Data vertical |
| `summarization` | `SummarizationConfig \| false` | Constructor default | Summarization config or `false` to disable |
| `includeRawData` | `boolean` | `true` | Include raw provider data |
| `includePlanning` | `boolean` | `false` | Include execution plan details |

#### Returns: `SearchResult`

| Field | Type | Description |
|-------|------|-------------|
| `summary` | `string?` | AI-generated summary |
| `rawData` | `unknown?` | Raw data from providers |
| `planning` | `PlanningInfo?` | Execution plan details |
| `usage` | `{ estimated, consumed }?` | API usage for this request |
| `account` | `{ balance, balanceTimestamp }?` | Account balance info |

---

### `plan(query, options?)`

Generate an execution plan without executing it. Plans are valid for 5 minutes.

```typescript
const plan = await kirha.plan("Compare BTC and ETH", {
  vertical: "crypto",
  summarization: "kirha-flash",
});

console.log(plan.id);
console.log(plan.status);
console.log(plan.steps);
console.log(plan.usage);
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `string` | Yes | The search query |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `vertical` | `string` | Constructor default | Data vertical |
| `summarization` | `SummarizationConfig` | Constructor default | Summarization for execution |

#### Returns: `Plan`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique plan identifier |
| `query` | `string` | Original query |
| `vertical` | `string` | Vertical used |
| `status` | `string` | Plan status |
| `steps` | `PlanStepResponse[]` | Planned execution steps |
| `reason` | `string?` | Reasoning for the plan |
| `usage` | `{ estimated, consumed }` | API usage for planning |
| `account` | `{ balance, balanceTimestamp }?` | Account balance info |

#### PlanStepResponse

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Step identifier |
| `toolName` | `string` | Tool to execute |
| `parameters` | `Record<string, unknown>` | Tool parameters |
| `reasoning` | `string?` | Why this step is needed |

---

### `plan.execute(options?)`

Execute a previously created plan.

```typescript
const result = await plan.execute({
  summarization: "kirha",
  includeRawData: true,
  includePlanning: true,
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `summarization` | `SummarizationConfig \| false` | Plan default | Override summarization |
| `includeRawData` | `boolean` | `true` | Include raw provider data |
| `includePlanning` | `boolean` | `false` | Include execution plan details |

#### Returns: `SearchResult`

---

### `tools(options)`

List available tools for a vertical.

```typescript
const tools = await kirha.tools({ vertical: "crypto" });

for (const tool of tools) {
  console.log(tool.name, tool.description);
}
```

#### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `vertical` | `string` | Yes | Data vertical |

#### Returns: `Tool[]`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Tool identifier |
| `name` | `string` | Tool name |
| `description` | `string` | Tool description |

---

### `executeTool(toolName, input)`

Execute a specific tool directly.

```typescript
const result = await kirha.executeTool("get_crypto_price", {
  symbol: "BTC",
  currency: "USD",
});

if (!result.isError) {
  console.log(result.output);
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `toolName` | `string` | Yes | Name of the tool to execute |
| `input` | `unknown` | Yes | Input matching the tool's input schema |

#### Returns: `ToolExecutionResult`

| Field | Type | Description |
|-------|------|-------------|
| `toolName` | `string` | Executed tool name |
| `output` | `unknown` | Tool output |
| `isError` | `boolean` | Whether execution failed |
| `errorMessage` | `string?` | Error message if failed |
| `usage` | `{ estimated, consumed }` | API usage |
