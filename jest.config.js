// jest.config.js

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        compilerOptions: {
          "types": ["@cloudflare/workers-types", "jest", "node"],

          // 👇 新增这一行来解决类型不匹配问题
          "esModuleInterop": true
        }
      }
    }]
  },

  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/index.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  testTimeout: 30000,
};