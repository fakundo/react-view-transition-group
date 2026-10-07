import { defineConfig } from '@playwright/test';

// No Node types in the project
declare const process: { env: Record<string, string | undefined> };

// Chromium of Playwright (`npx playwright install chromium`),
// `E2E_CHANNEL` for an installed browser: msedge, chrome, chrome-canary
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:5174',
    channel: process.env.E2E_CHANNEL,
  },
  webServer: {
    command: 'npx vite e2e/app --config vite.config.ts --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: true,
  },
});
