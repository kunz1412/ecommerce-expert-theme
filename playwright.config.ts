import { defineConfig } from '@playwright/test';

const baseURL = process.env.WP_URL || 'http://localhost:8080';

// Staging liegt hinter Basic Auth (BASIC_AUTH_USER/BASIC_AUTH_PASS). IGNORE_HTTPS_ERRORS=1 nur für lokale Tests mit selbstsigniertem Zertifikat.
const httpCredentials = process.env.BASIC_AUTH_USER
  ? { username: process.env.BASIC_AUTH_USER, password: process.env.BASIC_AUTH_PASS || '' }
  : undefined;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    httpCredentials,
    ignoreHTTPSErrors: process.env.IGNORE_HTTPS_ERRORS === '1',
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
