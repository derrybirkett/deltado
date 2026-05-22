import { test, expect } from '@playwright/test'

test('filters todos by status and persists across reload', async ({ page }) => {
  await page.goto('/')

  // Clear any persisted filter from previous runs so this test starts at "All".
  await page.evaluate(() => window.localStorage.removeItem('deltado:filter'))
  await page.reload()

  // Seed two todos and mark one complete.
  const activeTitle = `filters-active-${Date.now()}`
  const completedTitle = `filters-done-${Date.now()}`

  await page.fill('input[name="title"]', activeTitle)
  await page.locator('form').filter({ has: page.locator('input[name="title"]') }).getByRole('button', { name: 'Add' }).click()
  await expect(page.getByText(activeTitle)).toBeVisible()

  await page.fill('input[name="title"]', completedTitle)
  await page.locator('form').filter({ has: page.locator('input[name="title"]') }).getByRole('button', { name: 'Add' }).click()
  await expect(page.getByText(completedTitle)).toBeVisible()

  // Complete the second todo.
  const completedRow = page.locator('div').filter({ hasText: new RegExp(`^${completedTitle}$`) }).first()
  await completedRow.locator('xpath=ancestor::div[contains(@class, "border-b")][1]').getByRole('button', { name: 'Mark complete' }).click()

  // The three filter controls are visible above the list.
  const all = page.getByRole('tab', { name: 'All' })
  const active = page.getByRole('tab', { name: 'Active' })
  const completed = page.getByRole('tab', { name: 'Completed' })
  await expect(all).toBeVisible()
  await expect(active).toBeVisible()
  await expect(completed).toBeVisible()

  // Default is "All": both visible.
  await expect(all).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText(activeTitle)).toBeVisible()
  await expect(page.getByText(completedTitle)).toBeVisible()

  // Switch to Active: only the incomplete todo is visible.
  await active.click()
  await expect(active).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText(activeTitle)).toBeVisible()
  await expect(page.getByText(completedTitle)).not.toBeVisible()

  // Switch to Completed: only the completed todo is visible.
  await completed.click()
  await expect(completed).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText(completedTitle)).toBeVisible()
  await expect(page.getByText(activeTitle)).not.toBeVisible()

  // Selection persists across a full reload.
  await page.reload()
  await expect(page.getByRole('tab', { name: 'Completed' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText(completedTitle)).toBeVisible()
  await expect(page.getByText(activeTitle)).not.toBeVisible()

  // Cleanup: switch back to All, delete both seeded todos.
  await page.getByRole('tab', { name: 'All' }).click()
  for (const title of [activeTitle, completedTitle]) {
    const row = page.locator('div').filter({ hasText: new RegExp(`^${title}$`) }).first().locator('xpath=ancestor::div[contains(@class, "border-b")][1]')
    await row.getByRole('button', { name: 'Delete todo' }).click()
    await expect(page.getByText(title)).not.toBeVisible()
  }
})

test('filter controls are operable by keyboard', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.removeItem('deltado:filter'))
  await page.reload()

  const all = page.getByRole('tab', { name: 'All' })
  const active = page.getByRole('tab', { name: 'Active' })

  // Tab focus reaches the filter, and Enter activates it.
  await all.focus()
  await expect(all).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(active).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(active).toHaveAttribute('aria-selected', 'true')
})

test('layout fits a 375px viewport without horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/')

  const tablist = page.getByRole('tablist', { name: /filter todos/i })
  await expect(tablist).toBeVisible()

  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(1)
})
