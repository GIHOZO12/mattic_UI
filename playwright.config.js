import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const frontendURL = `http://127.0.0.1:${process.env.E2E_FRONTEND_PORT || "5175"}`;
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results/browser",
  workers: 1,
  timeout: 300000,
  expect: { timeout: 30000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: frontendURL,
    actionTimeout: 30000,
    viewport: { width: 1440, height: 1000 },
    launchOptions: existsSync(chrome) ? { executablePath: chrome } : {},
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node scripts/start-test-backend.mjs",
      url: "http://127.0.0.1:8001/api/v1/store/",
      timeout: 180000,
      reuseExistingServer: false,
    },
    {
      command: "node scripts/start-test-frontend.mjs",
      url: frontendURL,
      timeout: 180000,
      reuseExistingServer: false,
    },
  ],
});
