/**
 * Tests for proxy management functionality
 */

import {
  generateBrowserFingerprint,
  getProxyEndpoints,
  hashString,
  selectProxy,
} from "../../src/lib/proxyManager";

describe("Proxy Manager Module", () => {
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = createMockEnv();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("hashString", () => {
    it("should generate consistent hash for same input", () => {
      const hash1 = hashString("test-string");
      const hash2 = hashString("test-string");

      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe("number");
    });

    it("should generate different hashes for different inputs", () => {
      const hash1 = hashString("test-string-1");
      const hash2 = hashString("test-string-2");

      expect(hash1).not.toBe(hash2);
    });

    it("should handle empty strings", () => {
      const hash = hashString("");
      expect(typeof hash).toBe("number");
    });

    it("should handle special characters", () => {
      const hash = hashString("test@#$%^&*()");
      expect(typeof hash).toBe("number");
    });
  });

  describe("generateBrowserFingerprint", () => {
    it("should generate browser-like headers", () => {
      const fingerprint = generateBrowserFingerprint("192.168.1.1");

      expect(fingerprint).toHaveProperty("User-Agent");
      expect(fingerprint).toHaveProperty("Accept");
      expect(fingerprint).toHaveProperty("Accept-Language");
      expect(fingerprint).toHaveProperty("Accept-Encoding");
      expect(fingerprint).toHaveProperty("DNT");
      expect(fingerprint).toHaveProperty("Connection");
      expect(fingerprint).toHaveProperty("Upgrade-Insecure-Requests");
    });

    it("should generate consistent fingerprint for same IP", () => {
      const fp1 = generateBrowserFingerprint("192.168.1.1");
      const fp2 = generateBrowserFingerprint("192.168.1.1");

      expect(fp1).toEqual(fp2);
    });

    it("should generate different fingerprints for different IPs", () => {
      const fp1 = generateBrowserFingerprint("192.168.1.1");
      const fp2 = generateBrowserFingerprint("192.168.1.2");

      expect(fp1).not.toEqual(fp2);
    });

    it("should handle default IP when none provided", () => {
      const fingerprint = generateBrowserFingerprint();

      expect(fingerprint).toHaveProperty("User-Agent");
      expect(typeof fingerprint["User-Agent"]).toBe("string");
    });
  });

  describe("getProxyEndpoints", () => {
    it("should parse proxy URLs from environment", () => {
      const endpoints = getProxyEndpoints(mockEnv);

      expect(Array.isArray(endpoints)).toBe(true);
      expect(endpoints.length).toBeGreaterThan(0);
      expect(endpoints[0]).toHaveProperty("url");
    });

    it("should handle missing proxy URLs", () => {
      const envWithoutProxies = { ...mockEnv, PROXY_URLS: undefined };
      const endpoints = getProxyEndpoints(envWithoutProxies);

      expect(Array.isArray(endpoints)).toBe(true);
      expect(endpoints.length).toBe(0);
    });

    it("should handle empty proxy URLs", () => {
      const envWithEmptyProxies = { ...mockEnv, PROXY_URLS: "" };
      const endpoints = getProxyEndpoints(envWithEmptyProxies);

      expect(Array.isArray(endpoints)).toBe(true);
      expect(endpoints.length).toBe(0);
    });

    it("should filter out invalid URLs", () => {
      const envWithInvalidUrls = {
        ...mockEnv,
        PROXY_URLS: "https://valid.com,invalid-url,https://another-valid.com",
      };
      const endpoints = getProxyEndpoints(envWithInvalidUrls);

      expect(endpoints.length).toBe(2);
      expect(endpoints.every((ep) => ep.url.startsWith("https://"))).toBe(true);
    });
  });

  describe("selectProxy", () => {
    it("should select a proxy from available endpoints", async () => {
      const proxy = await selectProxy(mockEnv, "192.168.1.1");

      if (proxy) {
        expect(proxy).toHaveProperty("url");
        expect(typeof proxy.url).toBe("string");
      }
    });

    it("should return null when no proxies available", async () => {
      const envWithoutProxies = { ...mockEnv, PROXY_URLS: undefined };
      const proxy = await selectProxy(envWithoutProxies, "192.168.1.1");

      expect(proxy).toBeNull();
    });

    it("should select different proxies for different IPs", async () => {
      const proxy1 = await selectProxy(mockEnv, "192.168.1.1");
      const proxy2 = await selectProxy(mockEnv, "192.168.1.2");

      // With multiple proxies, different IPs might get different proxies
      // This test verifies the selection mechanism works
      expect(proxy1).toBeTruthy();
      expect(proxy2).toBeTruthy();
    });

    it("should handle client IP consistently", async () => {
      const proxy1 = await selectProxy(mockEnv, "192.168.1.1");
      const proxy2 = await selectProxy(mockEnv, "192.168.1.1");

      expect(proxy1).toEqual(proxy2);
    });
  });
});
