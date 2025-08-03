/**
 * Tests for retry logic functionality
 */

import { isRetryableError, retryWithBackoff } from "../../src/lib/retryLogic";

describe("Retry Logic Module", () => {
  describe("isRetryableError", () => {
    it("should identify retryable network errors", () => {
      const networkError = new Error("Network error");
      expect(isRetryableError(networkError)).toBe(true);
    });

    it("should identify retryable timeout errors", () => {
      const timeoutError = new Error("Request timeout");
      expect(isRetryableError(timeoutError)).toBe(true);
    });

    it("should identify retryable 5xx status codes", () => {
      const serverError = new Error("Server error");
      (serverError as any).status = 500;
      expect(isRetryableError(serverError)).toBe(true);

      const badGateway = new Error("Bad gateway");
      (badGateway as any).status = 502;
      expect(isRetryableError(badGateway)).toBe(true);
    });

    it("should identify retryable 429 status code", () => {
      const rateLimitError = new Error("Too many requests");
      (rateLimitError as any).status = 429;
      expect(isRetryableError(rateLimitError)).toBe(true);
    });

    it("should not retry 4xx client errors (except 429)", () => {
      const badRequest = new Error("Bad request");
      (badRequest as any).status = 400;
      expect(isRetryableError(badRequest)).toBe(false);

      const unauthorized = new Error("Unauthorized");
      (unauthorized as any).status = 401;
      expect(isRetryableError(unauthorized)).toBe(false);

      const notFound = new Error("Not found");
      (notFound as any).status = 404;
      expect(isRetryableError(notFound)).toBe(false);
    });

    it("should not retry 2xx success codes", () => {
      const success = new Error("Success");
      (success as any).status = 200;
      expect(isRetryableError(success)).toBe(false);
    });

    it("should handle errors without status codes", () => {
      const genericError = new Error("Generic error");
      expect(isRetryableError(genericError)).toBe(true);
    });

    it("should handle non-Error objects", () => {
      expect(isRetryableError("string error")).toBe(true);
      expect(isRetryableError({ message: "object error" })).toBe(true);
      expect(isRetryableError(null)).toBe(true);
    });
  });

  describe("retryWithBackoff", () => {
    it("should succeed on first try", async () => {
      const mockOperation = jest.fn().mockResolvedValue("success");

      const result = await retryWithBackoff(mockOperation);

      expect(result).toBe("success");
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it("should retry on retryable errors", async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce("success");

      const result = await retryWithBackoff(mockOperation, 3);

      expect(result).toBe("success");
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it("should not retry on non-retryable errors", async () => {
      const nonRetryableError = new Error("Bad request");
      (nonRetryableError as any).status = 400;

      const mockOperation = jest.fn().mockRejectedValue(nonRetryableError);

      await expect(
        retryWithBackoff(mockOperation, 3, 100, 1000, {
          isRetryable: isRetryableError,
        })
      ).rejects.toThrow("Bad request");

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it("should exhaust all retries", async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValue(new Error("Network error"));

      await expect(retryWithBackoff(mockOperation, 3, 10, 100)).rejects.toThrow(
        "Network error"
      );

      expect(mockOperation).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it("should apply exponential backoff", async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce("success");

      const startTime = Date.now();
      const result = await retryWithBackoff(mockOperation, 3, 50, 1000);
      const endTime = Date.now();

      expect(result).toBe("success");
      expect(mockOperation).toHaveBeenCalledTimes(3);
      // Should have some delay due to backoff
      expect(endTime - startTime).toBeGreaterThan(50);
    });

    it("should respect max delay", async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce("success");

      const startTime = Date.now();
      await retryWithBackoff(mockOperation, 3, 1000, 100); // maxDelay < baseDelay
      const endTime = Date.now();

      // Should not exceed maxDelay
      expect(endTime - startTime).toBeLessThan(200);
    });

    it("should use custom retry predicate", async () => {
      const customError = new Error("Custom error");
      const mockOperation = jest.fn().mockRejectedValue(customError);

      const customIsRetryable = jest.fn().mockReturnValue(false);

      await expect(
        retryWithBackoff(mockOperation, 3, 10, 100, {
          isRetryable: customIsRetryable,
        })
      ).rejects.toThrow("Custom error");

      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(customIsRetryable).toHaveBeenCalledWith(customError);
    });

    it("should handle zero retries", async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error("Error"));

      await expect(retryWithBackoff(mockOperation, 0)).rejects.toThrow("Error");

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it("should handle negative retry count", async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error("Error"));

      await expect(retryWithBackoff(mockOperation, -1)).rejects.toThrow(
        "Error"
      );

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });
  });
});
