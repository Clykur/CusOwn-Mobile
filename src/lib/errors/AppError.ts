export class AppError extends Error {
  public code: string;
  constructor(message: string, code: string = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

export const handleError = (err: unknown) => {
  if (err instanceof AppError) {
    console.error(`[AppError] ${err.code}: ${(err as Error).message}`);
  } else if (err instanceof Error) {
    console.error(`[Error]: ${(err as Error).message}`);
  } else {
    console.error(`[Unknown Error]:`, err);
  }
};
