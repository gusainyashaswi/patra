export class ApiResponse<T = any> {
  public statusCode: number;
  public data: T;
  public message: string;
  public success: boolean;
  public token?: string;
  public accessToken?: string;
  public refreshToken?: string;

  constructor(statusCode: number, data: T, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;

    if (data && typeof data === "object") {
      if ("token" in (data as Record<string, any>)) {
        this.token = (data as Record<string, any>).token;
      }
      if ("accessToken" in (data as Record<string, any>)) {
        this.accessToken = (data as Record<string, any>).accessToken;
      }
      if ("refreshToken" in (data as Record<string, any>)) {
        this.refreshToken = (data as Record<string, any>).refreshToken;
      }
    }
  }
}
