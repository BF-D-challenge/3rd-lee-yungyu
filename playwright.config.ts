import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  expect: { timeout: 8_000 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    colorScheme: "dark",
    locale: "ko-KR",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command:
      "env NEXT_PUBLIC_GOOGLE_LOGIN=0 NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_URL= SUPABASE_PUBLISHABLE_KEY= SUPABASE_ANON_KEY= npm run dev -- --port 3100",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
