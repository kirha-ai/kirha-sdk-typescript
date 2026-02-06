# Local Planning

Use local planning via `@kirha/planner` while executing tools via the Kirha API and local tools.

## Running the Model

On Mac (Apple Silicon), you can run the model locally using MLX:

```bash
# Install mlx-lm
pip install mlx-lm

# Start the server
mlx_lm.server --model kirha/planner-mlx-4bit
```

The server will start on `http://localhost:8080` with an OpenAI-compatible API.

Any OpenAI chat completion compatible endpoint can be used (vLLM, Ollama, etc.).

---

## Configuration

```typescript
import { Kirha, type LocalTool } from "kirha";

const kirha = new Kirha({
  apiKey: "your-api-key",
  planner: "http://localhost:8080/v1",
  vertical: "crypto",
  tools: customTools,
});
```

### Constructor Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | `string` | Yes | Your Kirha API key (for tool execution) |
| `planner` | `string` | Yes | Local planner URL |
| `vertical` | `string` | No | Default vertical for all requests |
| `tools` | `LocalTool[]` | No | Custom local tools |

---

## How It Works

1. **Fetch Tools** - SDK fetches available tools from `GET /tools?vertical_id=X`
2. **Merge Tools** - Local tools are merged with API tools
3. **Plan Locally** - `@kirha/planner` generates execution plan locally
4. **Execute Remotely** - Tool calls are executed via `POST /tools/execute`

---

## Methods

### `search(query, options?)`

Execute a search with local planning.

```typescript
const result = await kirha.search("Bitcoin price", {
  vertical: "crypto",
  tools: additionalTools,
});
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `string` | Yes | The search query |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `vertical` | `string` | Constructor default | Data vertical |
| `tools` | `LocalTool[]` | Constructor default | Additional tools for this request |

#### Returns: `SearchResult`

| Field | Type | Description |
|-------|------|-------------|
| `summary` | `undefined` | Not available in local mode |
| `data` | `unknown?` | Execution results |
| `planning` | `PlanningInfo?` | Execution plan details |

---

## Custom Local Tools

Define custom tools with handlers that execute locally:

```typescript
import { type LocalTool } from "kirha";

const customTools: LocalTool[] = [
  {
    name: "custom_calculator",
    description: "Add two numbers together",
    inputSchema: {
      type: "object",
      properties: {
        a: { type: "number", description: "First number" },
        b: { type: "number", description: "Second number" },
      },
      required: ["a", "b"],
    },
    outputSchema: {
      type: "object",
      properties: {
        result: { type: "number" },
      },
    },
    handler: async (input: { a: number; b: number }) => {
      return { result: input.a + input.b };
    },
  },
];
```

### LocalTool Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Tool name |
| `description` | `string` | Tool description for the planner |
| `inputSchema` | `Record<string, unknown>` | JSON Schema for input |
| `outputSchema` | `Record<string, unknown>` | JSON Schema for output |
| `handler` | `(input) => Promise<output>` | Async function to execute |

---

## Hybrid Tools

Combine local tools with API tools:

```typescript
const kirha = new Kirha({
  apiKey: "your-api-key",
  planner: "http://localhost:8080/v1",
  vertical: "crypto",
  tools: [
    {
      name: "get_crypto_price",
      description: "Get crypto price from custom source",
      inputSchema: { /* ... */ },
      outputSchema: { /* ... */ },
      handler: async (input) => {
        // Custom implementation
        return { price: 50000 };
      },
    },
  ],
});

// Uses custom get_crypto_price + other API tools
const result = await kirha.search("Bitcoin price");
```
