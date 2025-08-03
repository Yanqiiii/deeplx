/**
 * Jest test setup file
 * Global test configuration and utilities
 */

// Mock global fetch if not available
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.createMockEnv = (): Env => ({
  CACHE_KV: {
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    list: jest.fn(),
  } as any,
  RATE_LIMIT_KV: {
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    list: jest.fn(),
  } as any,

  ANALYTICS: {
    writeDataPoint: jest.fn(),
  } as any,
  PROXY_URLS:
    "https://test1.example.com/jsonrpc,https://test2.example.com/jsonrpc",
  PROXY_WEIGHTS: "1,1",
  DEBUG_MODE: "true",
});

// Mock Request and Response for Cloudflare Workers environment
global.Request =
  global.Request ||
  class MockRequest {
    constructor(public url: string, public init?: RequestInit) {}
    json() {
      return Promise.resolve({});
    }
    text() {
      return Promise.resolve("");
    }
    headers = new Map();
  };

global.Response =
  global.Response ||
  class MockResponse {
    constructor(public body?: any, public init?: ResponseInit) {}
    json() {
      return Promise.resolve(this.body);
    }
    text() {
      return Promise.resolve(String(this.body));
    }
    ok = true;
    status = 200;
    headers = new Map();
  };

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidTranslationResponse(): R;
      toBeValidErrorResponse(): R;
    }
  }

  function createMockEnv(): Env;
}

expect.extend({
  toBeValidTranslationResponse(received) {
    const pass =
      received &&
      typeof received.code === "number" &&
      (received.data !== undefined || received.code !== 200) &&
      typeof received.id === "number" &&
      typeof received.source_lang === "string" &&
      typeof received.target_lang === "string";

    return {
      message: () =>
        `expected ${JSON.stringify(
          received
        )} to be a valid translation response`,
      pass,
    };
  },

  toBeValidErrorResponse(received) {
    const pass =
      received &&
      typeof received.code === "number" &&
      received.code >= 400 &&
      received.data === null;

    return {
      message: () =>
        `expected ${JSON.stringify(received)} to be a valid error response`,
      pass,
    };
  },
});
