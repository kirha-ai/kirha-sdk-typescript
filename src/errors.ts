export type ApiErrorCode =
  | "authentication_error"
  | "rate_limit_exceeded"
  | "bad_request"
  | "not_found"
  | "internal_error"
  | "unknown_error";

export class KirhaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KirhaError";
  }
}

export class ConfigurationError extends KirhaError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export class ApiError extends KirhaError {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: ApiErrorCode,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = "Invalid or missing API key") {
    super(message, 401, "authentication_error");
    this.name = "AuthenticationError";
  }
}

export class RateLimitError extends ApiError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, 429, "rate_limit_exceeded");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class ValidationError extends KirhaError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

export class PlanExpiredError extends KirhaError {
  public readonly planId: string;

  constructor(planId: string) {
    super(`Plan ${planId} has expired (plans are valid for 5 minutes)`);
    this.name = "PlanExpiredError";
    this.planId = planId;
  }
}

export class NetworkError extends KirhaError {
  public override readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "NetworkError";
    this.cause = cause;
  }
}
