export class ApiError extends Error {
  public statusCode: number;
  public status: number;
  public data: null;
  public override message: string;
  public success: boolean;
  public errors: any[];
  public code: string;

  constructor(
    statusCode: number,
    message = "Something went wrong",
    errors: any[] = [],
    stack = "",
    code?: string,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    this.code =
      code ||
      (statusCode === 401
        ? "UNAUTHENTICATED"
        : statusCode === 403
          ? "FORBIDDEN"
          : statusCode === 404
            ? "NOT_FOUND"
            : statusCode === 409
              ? "CONFLICT"
              : statusCode === 400
                ? "BAD_REQUEST"
                : "INTERNAL");

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
