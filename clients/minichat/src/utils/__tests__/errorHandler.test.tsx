/**
 * errorHandler.test.tsx
 * 
 * errorHandler.ts unit tests
 * Tests for ApiError class and handleError function
 */

import { ApiError, handleError } from '../errorHandler';

describe('ApiError Class', () => {
  /**
   * Test: ApiError should be instantiated with status and message
   * Scenario: Create new ApiError instance
   */
  it('should create ApiError instance with status and message', () => {
    const error = new ApiError(401, 'Unauthorized');
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.message).toBe('Unauthorized');
    expect(error.name).toBe('ApiError');
  });

  /**
   * Test: ApiError should be instanceof Error
   * Scenario: Verify ApiError extends Error class
   */
  it('should be instance of Error', () => {
    const error = new ApiError(500, 'Server error');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('handleError Function', () => {
  /**
   * Parametrized Test: Should handle ApiError with different HTTP status codes
   * Scenario: Pass ApiError with various status codes (401, 400, 403, 404, 500, 503)
   */
  describe.each([
    [401, 'Unauthorized', 'User not authenticated'],
    [400, 'Bad Request', 'Invalid input data'],
    [403, 'Forbidden', 'Access denied'],
    [404, 'Not Found', 'Resource not found'],
    [500, 'Internal Server Error', 'Server crashed'],
    [503, 'Service Unavailable', 'Server maintenance'],
  ])('with ApiError status %i', (status, name, message) => {
    /**
     * Test: Should return formatted error object with correct status and message
     * Scenario: Pass ApiError with status code and message
     */
    it(`should return { status: ${status}, message: '${name}' }`, () => {
      const error = new ApiError(status, name);
      const result = handleError(error);

      expect(result).toEqual({
        status: status,
        message: name,
      });
    });

    /**
     * Test: Should preserve exact message from ApiError
     * Scenario: Ensure message is not modified
     */
    it(`should preserve message for status ${status}`, () => {
      const error = new ApiError(status, message);
      const result = handleError(error);

      expect(result.message).toBe(message);
    });
  });

  /**
   * Parametrized Test: Should handle non-ApiError objects with fallback behavior
   * Scenario: Pass generic Error, plain objects, null, undefined
   */
  describe.each([
    [new Error('Network failed'), 500, 'Network failed'],
    [new TypeError('Cannot read property'), 500, 'Cannot read property'],
    [{ message: 'Custom error' }, 500, 'Custom error'],
    [{ message: '' }, 500, 'Unknown error'],
    [null, 500, 'Unknown error'],
    [undefined, 500, 'Unknown error'],
  ])('with non-ApiError input', (error, expectedStatus, expectedMessage) => {
    /**
     * Test: Should return status 500 for non-ApiError
     * Scenario: Pass generic error objects
     */
    it(`should return status ${expectedStatus} for ${typeof error}`, () => {
      const result = handleError(error);
      expect(result.status).toBe(expectedStatus);
    });

    /**
     * Test: Should return appropriate message or 'Unknown error' fallback
     * Scenario: Extract message if exists, otherwise use default
     */
    it(`should return message '${expectedMessage}' for input`, () => {
      const result = handleError(error);
      expect(result.message).toBe(expectedMessage);
    });
  });

  /**
   * Test: Should return consistent structure
   * Scenario: Verify return object always has status and message properties
   */
  it('should always return object with status and message properties', () => {
    const error = new ApiError(400, 'Bad request');
    const result = handleError(error);

    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('message');
    expect(typeof result.status).toBe('number');
    expect(typeof result.message).toBe('string');
  });
});
