/**
 * ApiError class
 * Custom error class for API request failures
 * - status: HTTP status code (401, 400, 500, etc.)
 * - message: Human-readable error message
 */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
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
  
  return { status: 500, message: error.message || 'Unknown error' };
};
