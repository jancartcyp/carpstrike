import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.PORT ?? 3000)
const baseURL = `http://localhost:${PORT}`

/**
 * Tests e2e « smoke » : vérifient que les pages publiques se chargent.
 * Lance automatiquement le serveur Next (dev) et attend qu'il réponde.
 * Prérequis une fois : `npx playwright install chromium`.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
})
