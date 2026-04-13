import { describe, it, expect } from "bun:test";
import { Kirha, KirhaApi, KirhaLocal } from "../src/kirha";
import { Plan } from "../src/plan";
import { Task } from "../src/task";
import { ConfigurationError, ValidationError } from "../src/errors";

describe("Kirha", () => {
  describe("constructor overloads", () => {
    it("should return KirhaApi when no planner is provided", () => {
      const kirha = new Kirha({ apiKey: "test-key" });
      expect(kirha instanceof KirhaApi).toBe(true);
    });

    it("should return KirhaLocal when planner is provided", () => {
      const kirha = new Kirha({
        apiKey: "test-key",
        planner: "http://localhost:3000/v1",
      });
      expect(kirha instanceof KirhaLocal).toBe(true);
    });

    it("should throw ConfigurationError when apiKey is missing", () => {
      expect(() => new Kirha({ apiKey: "" })).toThrow(ConfigurationError);
    });
  });

  describe("KirhaApi", () => {
    it("should use default vertical from config", async () => {
      const kirha = new Kirha({ apiKey: "test-key", vertical: "crypto" });

      // This will fail with network error since we're not mocking,
      // but it should NOT throw ValidationError
      try {
        await kirha.search("test query");
      } catch (error) {
        expect(error instanceof ValidationError).toBe(false);
      }
    });

    it("should have all API methods", () => {
      const kirha = new Kirha({ apiKey: "test-key" });

      expect(typeof kirha.search).toBe("function");
      expect(typeof kirha.plan).toBe("function");
      expect(typeof kirha.tools).toBe("function");
      expect(typeof kirha.executeTool).toBe("function");
      expect(typeof kirha.task).toBe("function");
      expect(typeof kirha.getPlan).toBe("function");
      expect(typeof kirha.getTask).toBe("function");
    });
  });

  describe("getPlan", () => {
    it("should rehydrate a Plan from an id without a server call", () => {
      const kirha = new Kirha({ apiKey: "test-key" }) as KirhaApi;
      const plan = kirha.getPlan("plan_abc123");

      expect(plan).toBeInstanceOf(Plan);
      expect(plan.id).toBe("plan_abc123");
      expect(typeof plan.execute).toBe("function");
    });
  });

  describe("getTask", () => {
    it("should rehydrate a Task from an id without a server call", () => {
      const kirha = new Kirha({ apiKey: "test-key" }) as KirhaApi;
      const task = kirha.getTask("tsk_abc123");

      expect(task).toBeInstanceOf(Task);
      expect(task.id).toBe("tsk_abc123");
      expect(typeof task.status).toBe("function");
      expect(typeof task.result).toBe("function");
      expect(typeof task.wait).toBe("function");
    });
  });

  describe("KirhaLocal", () => {
    it("should throw ConfigurationError when planner URL is missing", () => {
      expect(
        () =>
          new KirhaLocal({
            apiKey: "test-key",
            planner: "",
          }),
      ).toThrow(ConfigurationError);
    });

    it("should only have search method", () => {
      const kirha = new Kirha({
        apiKey: "test-key",
        planner: "http://localhost:3000/v1",
      });

      expect(typeof kirha.search).toBe("function");
      // TypeScript should prevent these at compile time,
      // but we verify at runtime too
      expect("plan" in kirha).toBe(false);
      expect("tools" in kirha).toBe(false);
      expect("executeTool" in kirha).toBe(false);
    });
  });
});
