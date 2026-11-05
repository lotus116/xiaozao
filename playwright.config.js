import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  use: {
    baseURL: "http://127.0.0.1:5187",
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: "npm run preview -- --port 5187",
    url: "http://127.0.0.1:5187",
    reuseExistingServer: false,
  },
  reporter: "list",
});
