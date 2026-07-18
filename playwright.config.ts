import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3100";
const baseURL = `http://127.0.0.1:${port}`;

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
    storageState: {
      cookies: [],
      origins: [{
        origin: baseURL,
        localStorage: [
          { name: "oneul:demo-auth", value: "1" },
          { name: "oneul:demo-actor", value: "e2e-demo-actor" },
        ],
      }],
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command:
      `env NEXT_DIST_DIR=.next-e2e NEXT_PUBLIC_E2E=1 NEXT_PUBLIC_E2E_IDEA_AUTO_STEP_MS=80 NEXT_PUBLIC_GOOGLE_LOGIN=0 NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY= NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_URL= SUPABASE_PUBLISHABLE_KEY= SUPABASE_ANON_KEY= sh -c 'npm run build && npm run start -- --hostname 127.0.0.1 --port ${port}'`,
    url: baseURL,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === "1",
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
