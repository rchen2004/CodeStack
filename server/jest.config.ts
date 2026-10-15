/** @type {import('ts-jest').JestConfigWithTsJest} **/
// eslint-disable-next-line import/no-commonjs
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.ts', '**/tests/*.spec.ts'],
  testPathIgnorePatterns: ['/dist/', '/node_modules/', '/.stryker-tmp/'],
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
  setupFilesAfterEnv: ['./jest.setup.ts'],
};
