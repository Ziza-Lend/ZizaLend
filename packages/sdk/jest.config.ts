import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        // Use tsconfig.test.json for test-specific settings
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  moduleNameMapper: {
    // Handle ESM .js extensions in imports
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  clearMocks: true,
  restoreMocks: true,
};

export default config;
