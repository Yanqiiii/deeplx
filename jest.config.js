// jest.config.js (最终正确版本)

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      // ✅ 这是修正了结构的核心部分
      tsconfig: {
        // TypeScript 编译选项直接放在这里，而不是再嵌套一层 "compilerOptions"
        "types": ["@cloudflare/workers-types", "jest", "node"],
        "esModuleInterop": true
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