import { test } from '@playwright/test'

test('capture redesigned states', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('http://127.0.0.1:5173/')
  await page.waitForTimeout(500)
  await page.screenshot({
    path: 'docs/code-factory/efforts/2026-06-05-lol-18-0-local/redesign-home.png',
    fullPage: false,
  })

  await page.getByRole('button', { name: 'Start draft' }).click()
  await page.waitForTimeout(250)
  await page.getByRole('button', { name: 'Spin' }).click()
  await page.waitForTimeout(500)
  await page.screenshot({
    path: 'docs/code-factory/efforts/2026-06-05-lol-18-0-local/redesign-draw.png',
    fullPage: false,
  })

  for (let index = 0; index < 5; index += 1) {
    const spin = page.getByRole('button', { name: 'Spin' })
    if (await spin.count()) await spin.click()
    await page.locator('.choice-card').first().click()
    await page.waitForTimeout(120)
  }

  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(200)
  await page.screenshot({
    path: 'docs/code-factory/efforts/2026-06-05-lol-18-0-local/redesign-final.png',
    fullPage: false,
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('http://127.0.0.1:5173/')
  await page.getByRole('button', { name: 'Start draft' }).click()
  await page.waitForTimeout(250)
  await page.getByRole('button', { name: 'Spin' }).click()
  await page.waitForTimeout(500)
  await page.screenshot({
    path: 'docs/code-factory/efforts/2026-06-05-lol-18-0-local/redesign-mobile.png',
    fullPage: false,
  })
})
