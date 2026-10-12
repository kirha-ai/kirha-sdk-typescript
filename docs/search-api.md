# Search API

Full access to the KIRHA Search API with search, planning, and tool execution.

## Configuration

```typescript
import { Kirha } from "kirha";

const kirha = new Kirha({
  apiKey: "your-api-key",
  summarization: true,
});
```

### Constructor Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | `string` | Yes | Your KIRHA API key |
| `focus` | `string` | No | Default focus for all requests. Vertical slug to focus on (`crypto`, `insurance`, `company`, ...). Omit it to search every vertical |
| `summarization` | `SummarizationConfig` | No | Default summarization config |

### SummarizationConfig

```typescript
type SummarizationConfig = true | { instruction?: string };
```

---

## Methods

### `search(query, options?)`

Execute a search query with optional summarization.

```typescript
const result = await kirha.search("Bitcoin price", {
  focus: "crypto",
  summarization: { instruction: "Be concise" },
  includeData: true,
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
| `focus` | `string` | Constructor default | Vertical slug to focus on (`crypto`, `insurance`, `company`, ...). Omit it to search every vertical |
| `summarization` | `SummarizationConfig \| false` | Constructor default | Summarization config or `false` to disable |
| `includeData` | `boolean` | `true` | Include provider data |
| `includePlanning` | `boolean` | `false` | Include execution plan details |
| `planningRuntime` | `PlanningRuntime` | `PlanningRuntime.Standard` | `Standard` is more accurate, `Fast` answers sooner but is less accurate |

#### Returns: `SearchResult`

| Field | Type | Description |
|-------|------|-------------|
| `summary` | `string?` | AI-generated summary |
| `data` | `unknown?` | Data from providers |
| `planning` | `PlanningInfo?` | Execution plan details |
| `usage` | `{ estimated, consumed }?` | API usage for this request |
| `account` | `{ balance, balanceTimestamp }?` | Account balance info |

---

### `plan(query, options?)`

Generate an execution plan without executing it. Plans are valid for 5 minutes.

```typescript
const plan = await kirha.plan("Compare BTC and ETH", {
  summarization: true,
  planningRuntime: PlanningRuntime.Fast,
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
| `focus` | `string` | Constructor default | Vertical slug to focus on (`crypto`, `insurance`, `company`, ...). Omit it to search every vertical |
| `summarization` | `SummarizationConfig` | Constructor default | Summarization for execution |
| `planningRuntime` | `PlanningRuntime` | `PlanningRuntime.Standard` | `Standard` is more accurate, `Fast` answers sooner but is less accurate |

#### Returns: `Plan`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique plan identifier |
| `query` | `string` | Original query |
| `focus` | `string?` | Focus used |
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
  summarization: { instruction: "Answer in French" },
  includeData: true,
  includePlanning: true,
});
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `summarization` | `SummarizationConfig \| false` | Plan default | Override summarization |
| `includeData` | `boolean` | `true` | Include provider data |
| `includePlanning` | `boolean` | `false` | Include execution plan details |

#### Returns: `SearchResult`

Throws `PlanExpiredError` if the plan is older than 5 minutes.

---

### `tools(options)`

List the tools of a vertical.

```typescript
const tools = await kirha.tools({ focus: "crypto" });

for (const tool of tools) {
  console.log(tool.name, tool.description);
}
```

#### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `focus` | `string` | Yes | Vertical slug (`crypto`, `insurance`, `company`, ...) |

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
