import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4321',
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: 'off',
    launchOptions: {
      args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
