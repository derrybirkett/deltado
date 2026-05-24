import { test, expect } from '@playwright/test'

test.describe('todo checkbox toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.fill('input[name="title"]', 'Checkbox test todo')
    await page.click('button[type="submit"]')
    await expect(page.getByText('Checkbox test todo')).toBeVisible()
  })

  test.afterEach(async ({ page }) => {
    await page.goto('/')
    for (const btn of await page.getByRole('button', { name: 'Delete todo' }).all()) {
      await btn.click()
    }
  })

  test('marks a todo complete and shows strikethrough', async ({ page }) => {
    await page.getByRole('button', { name: 'Mark complete' }).click()
    const span = page.locator('span', { hasText: 'Checkbox test todo' })
    await expect(span).toHaveClass(/line-through/)
  })

  test('toggles back to incomplete', async ({ page }) => {
    await page.getByRole('button', { name: 'Mark complete' }).click()
    await expect(page.locator('span', { hasText: 'Checkbox test todo' })).toHaveClass(/line-through/)

    await page.getByRole('button', { name: 'Mark incomplete' }).click()
    await expect(page.locator('span', { hasText: 'Checkbox test todo' })).not.toHaveClass(/line-through/)
  })

  test('completed todo disappears from Active filter', async ({ page }) => {
    await page.getByRole('button', { name: 'Mark complete' }).click()
    await page.getByRole('link', { name: 'Active' }).click()
    await expect(page.getByText('Checkbox test todo')).not.toBeVisible()
  })

  test('completed todo appears in Completed filter', async ({ page }) => {
    await page.getByRole('button', { name: 'Mark complete' }).click()
    await page.getByRole('link', { name: 'Completed' }).click()
    await expect(page.getByText('Checkbox test todo')).toBeVisible()
  })

  test('incomplete todo is hidden in Completed filter', async ({ page }) => {
    await page.getByRole('link', { name: 'Completed' }).click()
    await expect(page.getByText('Checkbox test todo')).not.toBeVisible()
  })
})
