import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import {
  testDatabaseUrl,
  testSigningSecret,
} from "./tests/integration/helpers/env";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          fileParallelism: false,
          env: {
            DATABASE_URL: testDatabaseUrl,
            N8N_SIGNING_SECRET: testSigningSecret,
            N8N_WEBHOOK_BASE_URL: "http://localhost:5678/webhook",
            APP_BASE_URL: "http://localhost:3000",
          },
        },
      },
    ],
  },
});
