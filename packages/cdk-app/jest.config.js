/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    // '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.tsx?$': [
      'esbuild-jest',
      {
        sourcemap: true,
      },
    ],
  },
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  snapshotSerializers: ['<rootDir>/test/plugins/ignore-asset-hash.ts'],
};

module.exports = config;
