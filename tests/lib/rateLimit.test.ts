/**
 * Tests for rate limiting functionality
 */

import {
  checkRateLimit,
  delayRequest,
  getClientIP,
} from "../../src/lib/rateLimit";

describe("Rate Limit Module", () => {
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = createMockEnv();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getClientIP", () => {
    it("should extract IP from CF-Connecting-IP header", () => {
      const mockRequest = {
        headers: new Map([["CF-Connecting-IP", "192.168.1.1"]]),
      } as any;

      const ip = getClientIP(mockRequest);
      expect(ip).toBe("192.168.1.1");
    });

    it("should extract IP from X-Forwarded-For header", () => {
      const mockRequest = {
        headers: new Map([["X-Forwarded-For", "192.168.1.1, 10.0.0.1"]]),
      } as any;

      const ip = getClientIP(mockRequest);
      expect(ip).toBe("192.168.1.1");
    });

    it("should extract IP from X-Real-IP header", () => {
      const mockRequest = {
        headers: new Map([["X-Real-IP", "192.168.1.1"]]),
      } as any;

      const ip = getClientIP(mockRequest);
      expect(ip).toBe("192.168.1.1");
    });

    it("should return null when no IP headers present", () => {
      const mockRequest = {
        headers: new Map(),
      } as any;

      const ip = getClientIP(mockRequest);
      expect(ip).toBeNull();
    });

    it("should prioritize CF-Connecting-IP over other headers", () => {
      const mockRequest = {
        headers: new Map([
          ["CF-Connecting-IP", "192.168.1.1"],
          ["X-Forwarded-For", "10.0.0.1"],
          ["X-Real-IP", "172.16.0.1"],
        ]),
      } as any;

      const ip = getClientIP(mockRequest);
      expect(ip).toBe("192.168.1.1");
    });
  });

  describe("checkRateLimit", () => {
    it("should allow requests within rate limit", async () => {
      (mockEnv.RATE_LIMIT_KV.get as jest.Mock).mockResolvedValueOnce(null);

      const result = await checkRateLimit("192.168.1.1", mockEnv);

      expect(result.allowed).toBe(true);
      expect(result.remainingTokens).toBeGreaterThan(0);
    });

    it("should deny requests exceeding rate limit", async () => {
      const rateLimitEntry = {
        tokens: 0,
        lastRefill: Date.now(),
      };

      (mockEnv.RATE_LIMIT_KV.get as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(rateLimitEntry)
      );

      const result = await checkRateLimit("192.168.1.1", mockEnv);

      expect(result.allowed).toBe(false);
      expect(result.remainingTokens).toBe(0);
    });

    it("should refill tokens over time", async () => {
      const rateLimitEntry = {
        tokens: 0,
        lastRefill: Date.now() - 60000, // 1 minute ago
      };

      (mockEnv.RATE_LIMIT_KV.get as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(rateLimitEntry)
      );

      const result = await checkRateLimit("192.168.1.1", mockEnv);

      expect(result.allowed).toBe(true);
      expect(result.remainingTokens).toBeGreaterThan(0);
    });

    it("should handle KV errors gracefully", async () => {
      (mockEnv.RATE_LIMIT_KV.get as jest.Mock).mockRejectedValueOnce(
        new Error("KV error")
      );

      const result = await checkRateLimit("192.168.1.1", mockEnv);

      // Should allow request when KV is unavailable
      expect(result.allowed).toBe(true);
    });

    it("should handle invalid JSON in KV", async () => {
      (mockEnv.RATE_LIMIT_KV.get as jest.Mock).mockResolvedValueOnce(
        "invalid json"
      );

      const result = await checkRateLimit("192.168.1.1", mockEnv);

      expect(result.allowed).toBe(true);
    });
  });

  describe("delayRequest", () => {
    it("should delay for specified seconds", async () => {
      const startTime = Date.now();
      await delayRequest(0.1); // 100ms
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(90);
    });

    it("should handle zero delay", async () => {
      const startTime = Date.now();
      await delayRequest(0);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(10);
    });
  });
});
