import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Accessibility tests using axe-core
 * Tests for WCAG compliance and accessibility best practices
 */
test.describe('Accessibility Tests', () => {
  
  test('homepage should have no accessibility violations @accessibility', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })
  
  test('entry card should be accessible @accessibility', async ({ page }) => {
    await page.goto('/')
    
    // Wait for entry cards to load
    await page.waitForSelector('.entry-card', { timeout: 10000 })
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('.entry-card')
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })
  
  test('entry modal should be accessible @accessibility', async ({ page }) => {
    await page.goto('/')
    
    // Click on an entry to open modal
    const firstEntry = page.locator('.entry-card').first()
    await firstEntry.click()
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })
  
  test('navigation should be keyboard accessible @accessibility', async ({ page }) => {
    await page.goto('/')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
    
    // Check that focus is visible
    const focusStyles = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement
      return window.getComputedStyle(element).outline || window.getComputedStyle(element).boxShadow
    })
    expect(focusStyles).toBeTruthy()
  })
  
  test('images should have alt text @accessibility', async ({ page }) => {
    await page.goto('/')
    
    const images = await page.locator('img').all()
    
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
      expect(alt).not.toBe('')
    }
  })
  
  test('forms should have proper labels @accessibility', async ({ page }) => {
    await page.goto('/')
    
    // Open entry form if available
    const composeButton = page.locator('button:has-text("Compose"), button:has-text("+")').first()
    if (await composeButton.isVisible()) {
      await composeButton.click()
      await page.waitForTimeout(1000)
    }
    
    const inputs = await page.locator('input[type="text"], input[type="email"], textarea').all()
    
    for (const input of inputs) {
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      const label = id ? await page.locator(`label[for="${id}"]`).count() : 0
      
      // At least one labeling method should exist
      expect(label > 0 || ariaLabel || ariaLabelledBy).toBeTruthy()
    }
  })
})
