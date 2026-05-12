export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string) {
    super(message, 502);
    this.name = "ExternalServiceError";
  }
}

