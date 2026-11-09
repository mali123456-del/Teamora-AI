import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    watch: false,
    teardownTimeout: 2000,
    pool: 'forks',
  },
  resolve: {
    alias: {
      '@': path.resolve('.'),
    },
  },
});
