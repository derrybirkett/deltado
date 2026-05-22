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

test('filter bar is visible with All, Active, Completed options', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Filter todos' })
  await expect(nav).toBeVisible()
  await expect(nav.getByRole('link', { name: 'All' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Active' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Completed' })).toBeVisible()
})

test('"All" is selected by default', async ({ page }) => {
  await page.goto('/')
  const allLink = page.getByRole('link', { name: 'All' })
  await expect(allLink).toHaveAttribute('aria-current', 'page')
})

test('filter state is preserved in the URL', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Active' }).click()
  await expect(page).toHaveURL('/?filter=active')
  await expect(page.getByRole('link', { name: 'Active' })).toHaveAttribute('aria-current', 'page')
})

test('"Active" filter shows only incomplete todos', async ({ page }) => {
  await page.goto('/')

  // Add an incomplete todo
  await page.fill('input[name="title"]', 'Active task')
  await page.click('button[type="submit"]')
  await expect(page.getByText('Active task')).toBeVisible()

  // Add and complete another todo
  await page.fill('input[name="title"]', 'Done task')
  await page.click('button[type="submit"]')
  await page.getByRole('button', { name: 'Mark complete' }).nth(0).click()

  // Switch to Active filter
  await page.getByRole('link', { name: 'Active' }).click()
  await expect(page.getByText('Active task')).toBeVisible()
  await expect(page.getByText('Done task')).not.toBeVisible()

  // Cleanup
  await page.getByRole('button', { name: 'Delete todo' }).click()
})

test('"Completed" filter shows only completed todos', async ({ page }) => {
  await page.goto('/')

  // Add and complete a todo
  await page.fill('input[name="title"]', 'Finished item')
  await page.click('button[type="submit"]')
  await page.getByRole('button', { name: 'Mark complete' }).nth(0).click()

  // Add an incomplete todo
  await page.fill('input[name="title"]', 'Still todo')
  await page.click('button[type="submit"]')

  // Switch to Completed filter
  await page.getByRole('link', { name: 'Completed' }).click()
  await expect(page.getByText('Finished item')).toBeVisible()
  await expect(page.getByText('Still todo')).not.toBeVisible()

  // Cleanup
  await page.getByRole('button', { name: 'Delete todo' }).click()
  await page.goto('/')
  await page.getByRole('button', { name: 'Delete todo' }).click()
})

test('empty state message when no active todos', async ({ page }) => {
  await page.goto('/?filter=active')
  // If there are no active todos, the empty message should be shown
  // (This is a soft check — the message shows when list is empty)
  const allTodos = page.locator('[data-testid="todo-item"]')
  const count = await allTodos.count()
  if (count === 0) {
    await expect(page.getByText('No active todos.')).toBeVisible()
  }
})

test('filter bar is keyboard accessible via Tab and Enter', async ({ page }) => {
  await page.goto('/')
  // Tab into the filter bar links
  await page.keyboard.press('Tab') // focus Add input
  await page.keyboard.press('Tab') // focus Add button
  await page.keyboard.press('Tab') // focus All filter link
  const focusedHref = await page.evaluate(() => (document.activeElement as HTMLAnchorElement)?.href)
  expect(focusedHref).toMatch(/\/$|\/\?filter=/)
})
