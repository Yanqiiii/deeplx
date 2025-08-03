// jest.config.js

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  
  // 1. 使用了正确的配置方式，替代了旧的 globals 写法
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        // 2. 在 types 数组中加入了 'node'，解决了 'global' 未定义的问题
        types: ["@cloudflare/workers-types", "jest", "node"]
      }
    }]
  },

  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/index.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

  // 3. 修正了 moduleNameMapping 的拼写错误
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  testTimeout: 30000,
};