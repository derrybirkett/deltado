import { test, expect } from '@playwright/test'

test('can add, complete, and delete a todo', async ({ page }) => {
  await page.goto('/')

  // Add a todo
  await page.fill('input[name="title"]', 'Buy groceries')
  await page.click('button[type="submit"]')
  await expect(page.getByText('Buy groceries')).toBeVisible()

  // Toggle complete
  await page.click('button[aria-label="Mark complete"]')
  await expect(page.getByText('Buy groceries')).toHaveClass(/line-through/)

  // Delete
  await page.click('button[aria-label="Delete todo"]')
  await expect(page.getByText('Buy groceries')).not.toBeVisible()
})
