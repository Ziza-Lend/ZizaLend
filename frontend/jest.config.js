/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/e2e/", "<rootDir>/node_modules/"],
  // next.js's `next/jest` wrapper expands ignore patterns to include its own
  // packages, but next-intl and the @formatjs stack ship ESM and need to be
  // transformed under Jest. Negate the relevant vendor roots so Babel/ts-jest
  // can parse them.
  transformIgnorePatterns: [
    "/node_modules/(?!(next-intl|@formatjs|intl-messageformat|intl-messageformat-format-cache|@internationalized)/)",
  ],
};

module.exports = createJestConfig(customJestConfig);
