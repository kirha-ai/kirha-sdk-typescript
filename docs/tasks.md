# Tasks API

Async tasks for long-running operations with polling support.

## Overview

Tasks are asynchronous research that return immediately and can be polled for status and results. Use tasks for complex queries that may take longer to complete.

## Task Status Flow

```
Queued → Researching → Validating → Summarizing → Completed
                                                    ↘ Failed
```

---

## Methods

### `task(query, options?)`

Create a new async task. Returns immediately with a `Task` object.

```typescript
const task = await kirha.task("Compare the AI strategies of Google, Microsoft, and Meta", {
  instruction: "Focus on 2024-2025 developments",
});

console.log(task.id);
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `string` | Yes | The search/query string |
| `instruction` | `string` | No | Additional instruction for the task |

#### Returns: `Task`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique task identifier |

---

### `task.wait(options?)`

Poll the task until it reaches a terminal state (`Completed` or `Failed`). Returns the final result.

```typescript
const result = await task.wait({
  pollInterval: 2_000,  // poll every 2 seconds
  timeout: 600_000,     // max 10 minutes (default)
});

if (result.status === TaskStatus.Completed) {
  console.log(result.result);
} else {
  console.log(result.error);
}
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pollInterval` | `number` | `2000` | Polling interval in milliseconds |
| `timeout` | `number` | `600000` | Maximum wait time in milliseconds (10 min) |

#### Returns: `TaskResultResponse`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Task identifier |
| `status` | `TaskStatus` | Current status |
| `result` | `string \| null` | Task result (when Completed) |
| `error` | `string \| null` | Error message (when Failed) |

---

### `task.status()`

Get the current task status. Updates the cached status used by getters.

```typescript
const status = await task.status();
console.log(status.status); // TaskStatus.Queued, TaskStatus.Researching, etc.
```

#### Returns: `TaskStatusResponse`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Task identifier |
| `status` | `TaskStatus` | Current status |

---

### `task.result()`

Get the task result (includes status, result, and error).

```typescript
const result = await task.result();

if (result.status === TaskStatus.Completed) {
  console.log(result.result);
}
```

#### Returns: `TaskResultResponse`

---

## Status Getters

The `Task` class provides convenience getters based on the cached status (updated after `status()` or `wait()` calls):

```typescript
const task = await kirha.task("query");

// Check current state
if (task.isCompleted) {
  console.log("Already done!");
}

if (task.isFailed) {
  console.log("Task failed");
}

if (task.isPending) {
  console.log("Still working...");
}
```

| Getter | Type | Description |
|--------|------|-------------|
| `isCompleted` | `boolean` | True if status is `Completed` |
| `isFailed` | `boolean` | True if status is `Failed` |
| `isPending` | `boolean` | True if status is any non-terminal state |
| `isQueued` | `boolean` | True if status is `Queued` |
| `isResearching` | `boolean` | True if status is `Researching` |
| `isValidating` | `boolean` | True if status is `Validating` |
| `isSummarizing` | `boolean` | True if status is `Summarizing` |

---

## Types

### `TaskStatus` (enum)

```typescript
enum TaskStatus {
  Queued = "Queued",
  Researching = "Researching",
  Validating = "Validating",
  Summarizing = "Summarizing",
  Completed = "Completed",
  Failed = "Failed",
}
```

### `TaskOptions`

```typescript
interface TaskOptions {
  instruction?: string;
}
```

### `TaskWaitOptions`

```typescript
interface TaskWaitOptions {
  pollInterval?: number;  // default: 2_000ms
  timeout?: number;       // default: 600_000ms (10 min)
}
```

---

## Error Handling

`task.wait()` throws an error if the timeout is exceeded:

```typescript
try {
  const result = await task.wait({ timeout: 60_000 });
} catch (error) {
  console.log("Task timed out");
}
```

For failed tasks, check the `error` field in the result:

```typescript
const result = await task.wait();

if (result.status === TaskStatus.Failed) {
  console.log("Task failed:", result.error);
}
```
