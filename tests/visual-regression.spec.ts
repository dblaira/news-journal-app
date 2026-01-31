import { test, expect } from '@playwright/test'

/**
 * Visual regression tests
 * Captures screenshots and compares them to baseline images
 * Run with --update-snapshots to update baseline images
 */
test.describe('Visual Regression Tests', () => {
  
  test('homepage visual snapshot @visual', async ({ page }) => {
    await page.goto('/')
    
    // Wait for content to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Allow animations to complete
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })
  
  test('entry card visual snapshot @visual', async ({ page }) => {
    await page.goto('/')
    
    // Wait for entry cards to load
    await page.waitForSelector('.entry-card', { timeout: 10000 })
    
    const entryCard = page.locator('.entry-card').first()
    
    await expect(entryCard).toHaveScreenshot('entry-card.png', {
      animations: 'disabled',
    })
  })
  
  test('entry modal visual snapshot @visual', async ({ page }) => {
    await page.goto('/')
    
    // Click on an entry to open modal
    const firstEntry = page.locator('.entry-card').first()
    await firstEntry.click()
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    await page.waitForTimeout(1000) // Allow animations
    
    const modal = page.locator('[role="dialog"]').first()
    
    await expect(modal).toHaveScreenshot('entry-modal.png', {
      animations: 'disabled',
    })
  })
  
  test('sidebar visual snapshot @visual', async ({ page }) => {
    await page.goto('/')
    
    // Wait for sidebar to load (desktop view)
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForTimeout(1000)
    
    const sidebar = page.locator('aside').first()
    
    if (await sidebar.isVisible()) {
      await expect(sidebar).toHaveScreenshot('sidebar.png', {
        animations: 'disabled',
      })
    }
  })
  
  test('mobile view visual snapshot @visual', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone size
    await page.goto('/')
    
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })
  
  test('tablet view visual snapshot @visual', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }) // iPad size
    await page.goto('/')
    
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })
})
