// jest.config.js (最终修正版)
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/index.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  moduleNameMapper: { // <-- 已修正拼写
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testTimeout: 30000,
  globals: {
    "ts-jest": {
      tsconfig: { // <-- 已修正类型和兼容性选项
        target: "ES2020",
        module: "commonjs",
        lib: ["ES2020", "WebWorker"],
        types: ["@cloudflare/workers-types", "jest", "node"],
        esModuleInterop: true,
      },
    },
  },
};