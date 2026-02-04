import { describe, it, expect } from "bun:test";
import {
  KirhaError,
  ConfigurationError,
  ApiError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  PlanExpiredError,
  NetworkError,
} from "../src/errors";

describe("errors", () => {
  describe("KirhaError", () => {
    it("should create base error with message", () => {
      const error = new KirhaError("test error");
      expect(error.message).toBe("test error");
      expect(error.name).toBe("KirhaError");
      expect(error instanceof Error).toBe(true);
    });
  });

  describe("ConfigurationError", () => {
    it("should create configuration error", () => {
      const error = new ConfigurationError("missing apiKey");
      expect(error.message).toBe("missing apiKey");
      expect(error.name).toBe("ConfigurationError");
      expect(error instanceof KirhaError).toBe(true);
    });
  });

  describe("ApiError", () => {
    it("should create API error with all properties", () => {
      const error = new ApiError("not found", 404, "not_found", {
        id: "123",
      });
      expect(error.message).toBe("not found");
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("not_found");
      expect(error.details).toEqual({ id: "123" });
      expect(error.name).toBe("ApiError");
      expect(error instanceof KirhaError).toBe(true);
    });
  });

  describe("AuthenticationError", () => {
    it("should create auth error with default message", () => {
      const error = new AuthenticationError();
      expect(error.message).toBe("Invalid or missing API key");
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("authentication_error");
      expect(error.name).toBe("AuthenticationError");
      expect(error instanceof ApiError).toBe(true);
    });

    it("should create auth error with custom message", () => {
      const error = new AuthenticationError("API key expired");
      expect(error.message).toBe("API key expired");
    });
  });

  describe("RateLimitError", () => {
    it("should create rate limit error with retry after", () => {
      const error = new RateLimitError("Too many requests", 60);
      expect(error.message).toBe("Too many requests");
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe("rate_limit_exceeded");
      expect(error.retryAfter).toBe(60);
      expect(error.name).toBe("RateLimitError");
      expect(error instanceof ApiError).toBe(true);
    });

    it("should create rate limit error without retry after", () => {
      const error = new RateLimitError("Too many requests");
      expect(error.retryAfter).toBeUndefined();
    });
  });

  describe("ValidationError", () => {
    it("should create validation error with field", () => {
      const error = new ValidationError("vertical is required", "vertical");
      expect(error.message).toBe("vertical is required");
      expect(error.field).toBe("vertical");
      expect(error.name).toBe("ValidationError");
      expect(error instanceof KirhaError).toBe(true);
    });

    it("should create validation error without field", () => {
      const error = new ValidationError("invalid input");
      expect(error.field).toBeUndefined();
    });
  });

  describe("PlanExpiredError", () => {
    it("should create plan expired error with plan ID", () => {
      const error = new PlanExpiredError("plan-123");
      expect(error.message).toBe(
        "Plan plan-123 has expired (plans are valid for 5 minutes)",
      );
      expect(error.planId).toBe("plan-123");
      expect(error.name).toBe("PlanExpiredError");
      expect(error instanceof KirhaError).toBe(true);
    });
  });

  describe("NetworkError", () => {
    it("should create network error with cause", () => {
      const cause = new Error("connection refused");
      const error = new NetworkError("Failed to connect", cause);
      expect(error.message).toBe("Failed to connect");
      expect(error.cause).toBe(cause);
      expect(error.name).toBe("NetworkError");
      expect(error instanceof KirhaError).toBe(true);
    });

    it("should create network error without cause", () => {
      const error = new NetworkError("timeout");
      expect(error.cause).toBeUndefined();
    });
  });
});
