import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4322',
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        launchOptions: {
          args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl'],
        },
      },
    },
  ],
  webServer: {
    command: 'npx astro preview --port 4322 --host 127.0.0.1',
    url: 'http://127.0.0.1:4322/',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
