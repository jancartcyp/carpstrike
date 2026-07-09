import { expect, test } from '@playwright/test'

// Le logo « CARP STRIKE » du header est présent sur toutes les pages (layout racine).
async function expectHeader(page: import('@playwright/test').Page) {
  await expect(page.getByText('STRIKE', { exact: true }).first()).toBeVisible()
}

test("page d'accueil se charge", async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/CarpStrike/i)
  await expectHeader(page)
})

test('recherche des enduros', async ({ page }) => {
  await page.goto('/enduros')
  await expectHeader(page)
})

test('page tarifs', async ({ page }) => {
  await page.goto('/tarifs')
  await expectHeader(page)
  await expect(page.getByRole('heading').first()).toBeVisible()
})

test('page FAQ', async ({ page }) => {
  await page.goto('/faq')
  await expectHeader(page)
})

test('page contact', async ({ page }) => {
  await page.goto('/contact')
  await expectHeader(page)
})

test('formulaire de connexion présent', async ({ page }) => {
  await page.goto('/connexion')
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
})

test('formulaire d’inscription présent', async ({ page }) => {
  await page.goto('/inscription')
  await expect(page.locator('input[name="firstName"]')).toBeVisible()
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
})

test('route protégée redirige vers la connexion', async ({ page }) => {
  await page.goto('/profil')
  await expect(page).toHaveURL(/\/connexion/)
})
