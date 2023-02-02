/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  // roots: ['<rootDir>/test'],
  // testMatch: ['**/*.test.ts'],
  transform: {
    // '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.tsx?$': [
      'esbuild-jest',
      {
        sourcemap: true,
        target: 'esnext',
        format: 'esm',
      },
    ],
  },
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
};

module.exports = config;
