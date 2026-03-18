import type { ApiService } from "./api-service";
import type {
  TaskStatusResponse,
  TaskResultResponse,
  TaskWaitOptions,
} from "./types";
import { TaskStatus } from "./types";

const DEFAULT_POLL_INTERVAL = 2_000;
const DEFAULT_10_MIN_TIMEOUT = 600_000;

const TERMINAL_STATUSES: TaskStatus[] = [TaskStatus.Completed, TaskStatus.Failed];
const PENDING_STATUSES: TaskStatus[] = [
  TaskStatus.Queued,
  TaskStatus.Researching,
  TaskStatus.Validating,
  TaskStatus.Summarizing,
];

export class Task {
  private readonly apiService: ApiService;
  private cachedStatus?: TaskStatus;

  public readonly id: string;

  constructor(apiService: ApiService, id: string, initialStatus?: TaskStatus) {
    this.apiService = apiService;
    this.id = id;
    this.cachedStatus = initialStatus;
  }

  async status(): Promise<TaskStatusResponse> {
    const response = await this.apiService.getTaskStatus(this.id);
    this.cachedStatus = response.status;
    return response;
  }

  async result(): Promise<TaskResultResponse> {
    return this.apiService.getTaskResult(this.id);
  }

  async wait(options?: TaskWaitOptions): Promise<TaskResultResponse> {
    const pollInterval = options?.pollInterval ?? DEFAULT_POLL_INTERVAL;
    const timeout = options?.timeout ?? DEFAULT_10_MIN_TIMEOUT;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.apiService.getTaskStatus(this.id);
      this.cachedStatus = status.status;

      if (TERMINAL_STATUSES.includes(status.status)) {
        return this.apiService.getTaskResult(this.id);
      }

      await sleep(pollInterval);
    }

    throw new Error(`Task ${this.id} timed out after ${timeout}ms`);
  }

  get isCompleted(): boolean {
    return this.cachedStatus === TaskStatus.Completed;
  }

  get isFailed(): boolean {
    return this.cachedStatus === TaskStatus.Failed;
  }

  get isPending(): boolean {
    return this.cachedStatus !== undefined && PENDING_STATUSES.includes(this.cachedStatus);
  }

  get isQueued(): boolean {
    return this.cachedStatus === TaskStatus.Queued;
  }

  get isResearching(): boolean {
    return this.cachedStatus === TaskStatus.Researching;
  }

  get isValidating(): boolean {
    return this.cachedStatus === TaskStatus.Validating;
  }

  get isSummarizing(): boolean {
    return this.cachedStatus === TaskStatus.Summarizing;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
