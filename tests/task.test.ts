import { describe, it, expect, mock, afterEach } from "bun:test";
import { Task } from "../src/task";
import { ApiService } from "../src/api-service";
import { TaskStatus } from "../src/types";

// Re-export TaskStatus as a value for test use
const Status = TaskStatus;

type MockFetch = ReturnType<
  typeof mock<(url: string, options: RequestInit) => Promise<Response>>
>;

describe("Task", () => {
  const originalFetch = globalThis.fetch;
  let mockFn: MockFetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetch(response: {
    ok: boolean;
    status: number;
    json: () => Promise<unknown>;
  }) {
    mockFn = mock(() =>
      Promise.resolve({
        ok: response.ok,
        status: response.status,
        json: response.json,
        headers: new Headers(),
      } as Response),
    );
    globalThis.fetch = mockFn as unknown as typeof fetch;
  }

  describe("constructor", () => {
    it("should store id and initial status", () => {
      const service = new ApiService({ apiKey: "test-key" });
      const task = new Task(service, "task-123", Status.Queued);

      expect(task.id).toBe("task-123");
      expect(task.isQueued).toBe(true);
      expect(task.isPending).toBe(true);
    });
  });

  describe("status getters", () => {
    const service = new ApiService({ apiKey: "test-key" });

    it("isCompleted should return true for Completed status", () => {
      const task = new Task(service, "task-1", Status.Completed);
      expect(task.isCompleted).toBe(true);
      expect(task.isFailed).toBe(false);
      expect(task.isPending).toBe(false);
    });

    it("isFailed should return true for Failed status", () => {
      const task = new Task(service, "task-1", Status.Failed);
      expect(task.isFailed).toBe(true);
      expect(task.isCompleted).toBe(false);
      expect(task.isPending).toBe(false);
    });

    it("isPending should return true for non-terminal statuses", () => {
      const pendingStatuses = [
        Status.Queued,
        Status.Researching,
        Status.Validating,
        Status.Summarizing,
      ];

      for (const status of pendingStatuses) {
        const task = new Task(service, "task-1", status);
        expect(task.isPending).toBe(true);
      }
    });

    it("isQueued should return true only for Queued status", () => {
      const task = new Task(service, "task-1", Status.Queued);
      expect(task.isQueued).toBe(true);

      const task2 = new Task(service, "task-1", Status.Researching);
      expect(task2.isQueued).toBe(false);
    });

    it("isResearching should return true only for Researching status", () => {
      const task = new Task(service, "task-1", Status.Researching);
      expect(task.isResearching).toBe(true);
    });

    it("isValidating should return true only for Validating status", () => {
      const task = new Task(service, "task-1", Status.Validating);
      expect(task.isValidating).toBe(true);
    });

    it("isSummarizing should return true only for Summarizing status", () => {
      const task = new Task(service, "task-1", Status.Summarizing);
      expect(task.isSummarizing).toBe(true);
    });

    it("getters should return false when status is undefined", () => {
      const task = new Task(service, "task-1");
      expect(task.isCompleted).toBe(false);
      expect(task.isFailed).toBe(false);
      expect(task.isPending).toBe(false);
    });
  });

  describe("status()", () => {
    it("should fetch and cache status", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: "task-123", status: "Researching" }),
      });

      const service = new ApiService({ apiKey: "test-key" });
      const task = new Task(service, "task-123", Status.Queued);

      expect(task.isQueued).toBe(true);

      const response = await task.status();
      expect(response.status).toBe(Status.Researching);
      expect(task.isResearching).toBe(true);
    });
  });

  describe("result()", () => {
    it("should fetch task result", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: "task-123",
            status: "Completed",
            result: "Done",
            error: null,
          }),
      });

      const service = new ApiService({ apiKey: "test-key" });
      const task = new Task(service, "task-123");

      const result = await task.result();
      expect(result.status).toBe(Status.Completed);
      expect(result.result).toBe("Done");
    });
  });

  describe("wait()", () => {
    it("should poll until Completed", async () => {
      let callCount = 0;
      mockFn = mock(async () => {
        callCount++;
        const status = callCount < 3 ? "Researching" : "Completed";
        return {
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              id: "task-123",
              status,
              result: status === "Completed" ? "Final result" : null,
              error: null,
            }),
          headers: new Headers(),
        } as Response;
      });
      globalThis.fetch = mockFn as unknown as typeof fetch;

      const service = new ApiService({ apiKey: "test-key" });
      const task = new Task(service, "task-123");

      const result = await task.wait({ pollInterval: 10 });
      expect(result.status).toBe(Status.Completed);
      expect(result.result).toBe("Final result");
    });

    it("should throw on timeout", async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ id: "task-123", status: "Researching" }),
      });

      const service = new ApiService({ apiKey: "test-key" });
      const task = new Task(service, "task-123");

      expect(task.wait({ pollInterval: 10, timeout: 50 })).rejects.toThrow(
        "timed out",
      );
    });
  });
});
