import path from 'path';
// import { fileURLToPath, URL } from 'url'
import 'vitest/config';
import { defineConfig, type UserConfig } from 'vite';

const testConfigBase = {
  globals: true,
  globalSetup: ['./vitest.global-setup.ts'],
  setupFiles: ['./vitest.setup.ts'],
  environment: 'node',
  reporters: ['verbose'],
  passWithNoTests: true,
} satisfies UserConfig['test'];

const unitTestConfig = {
  ...testConfigBase,
  coverage: {
    enabled: true,
  },
  include: ['./test/unit/**/*.test.ts', './src/**/*.test.ts'],
} satisfies UserConfig['test'];

const integrationTestConfig = {
  ...testConfigBase,
  threads: false,
  include: ['./test/integration/**/*.test.ts'],
} satisfies UserConfig['test'];

const testConfig: UserConfig['test'] =
  process.env.IS_INTEGRATION_TEST === 'true' ? integrationTestConfig : unitTestConfig;

export default defineConfig({
  test: {
    ...testConfig,
  },
  resolve: {
    alias: {
      $api: path.join(__dirname, './src'),
    },
  },
});
