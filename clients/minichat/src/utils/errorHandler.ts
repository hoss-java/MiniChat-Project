/**
 * ApiError class
 * Custom error class for API request failures
 * - status: HTTP status code (401, 400, 500, etc.)
 * - message: Human-readable error message
 */
export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
    // Fix instanceof check in TypeScript
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Global error handler
 * Formats errors to consistent structure
 * @param error - Any error object
 * @returns Formatted error with status and message
 */
export const handleError = (error: any): { status: number; message: string } => {
  if (error instanceof ApiError) {
    return { status: error.status, message: error.message };
  }

  // Check if error has status property (for non-ApiError objects)
  if (error?.status && typeof error.status === 'number') {
    return { status: error.status, message: error.message || 'Unknown error' };
  }

  return { status: 500, message: error?.message || 'Unknown error' };
};
