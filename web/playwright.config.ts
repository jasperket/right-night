import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const fakeN8nPort = 3199;
const signingSecret = "e2e-test-signing-secret-32-chars-long";
const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgres://rightnight:rightnight-dev@localhost:5433/rightnight_test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
    // Differs from the app server's TZ below, so times must be formatted in the viewer's zone.
    timezoneId: "Asia/Manila",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // Stands in for n8n: verifies the webhook and calls back with 2 Proposals.
      command: "node tests/e2e/fake-n8n.mjs",
      url: `http://localhost:${fakeN8nPort}`,
      reuseExistingServer: false,
      env: { FAKE_N8N_PORT: String(fakeN8nPort), N8N_SIGNING_SECRET: signingSecret },
    },
    {
      command: `pnpm dev --port ${port}`,
      url: `http://localhost:${port}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        DATABASE_URL: databaseUrl,
        N8N_SIGNING_SECRET: signingSecret,
        N8N_WEBHOOK_BASE_URL: `http://localhost:${fakeN8nPort}/webhook`,
        APP_BASE_URL: `http://localhost:${port}`,
        TZ: "UTC",
      },
    },
  ],
});
