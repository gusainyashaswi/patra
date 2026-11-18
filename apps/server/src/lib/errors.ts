export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const NotFound = (what = "Resource") => new AppError(404, "NOT_FOUND", `${what} not found`);
export const Conflict = (msg: string) => new AppError(409, "CONFLICT", msg);
export const Forbidden = (msg = "Forbidden") => new AppError(403, "FORBIDDEN", msg);

export class TransientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransientError";
  }
}

export class PermanentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermanentError";
  }
}
