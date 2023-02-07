import path from 'path';
// import { fileURLToPath, URL } from 'url'
import 'vitest/config';
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      $lambda: __dirname,
      $api: path.join(__dirname, '../fastify-app/src'),
    },
  },
});
