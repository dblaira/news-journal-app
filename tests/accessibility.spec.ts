import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Accessibility tests using axe-core
 * Tests for WCAG compliance and accessibility best practices
 * Note: Tests focus on public pages (login) since auth requires credentials
 */
test.describe('Accessibility Tests', () => {
  
  test('login page should have no critical accessibility violations @accessibility', async ({ page }) => {
    await page.goto('/login')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      // Exclude minor issues that don't impact usability
      .exclude('[aria-hidden="true"]')
      .analyze()
    
    // Filter to only critical and serious violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    )
    
    // Log violations for debugging
    if (criticalViolations.length > 0) {
      console.log('Critical accessibility violations:', JSON.stringify(criticalViolations, null, 2))
    }
    
    expect(criticalViolations).toEqual([])
  })
  
  test('login form should be accessible @accessibility', async ({ page }) => {
    await page.goto('/login')
    
    await page.waitForLoadState('networkidle')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('form')
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze()
    
    // Filter to only critical and serious violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    )
    
    expect(criticalViolations).toEqual([])
  })
  
  test('navigation should be keyboard accessible @accessibility', async ({ page }) => {
    await page.goto('/login')
    
    await page.waitForLoadState('networkidle')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    
    // Check that focus moved to an interactive element
    const focusedTagName = await page.evaluate(() => document.activeElement?.tagName)
    expect(['INPUT', 'BUTTON', 'A', 'SELECT', 'TEXTAREA']).toContain(focusedTagName)
  })
  
  test('form inputs should have proper labels @accessibility', async ({ page }) => {
    await page.goto('/login')
    
    await page.waitForLoadState('networkidle')
    
    // Check email input
    const emailInput = page.locator('input[name="email"]')
    const emailAriaLabel = await emailInput.getAttribute('aria-label')
    const emailId = await emailInput.getAttribute('id')
    const emailLabel = emailId ? await page.locator(`label[for="${emailId}"]`).count() : 0
    expect(emailAriaLabel || emailLabel > 0).toBeTruthy()
    
    // Check password input
    const passwordInput = page.locator('input[name="password"]')
    const passwordAriaLabel = await passwordInput.getAttribute('aria-label')
    const passwordId = await passwordInput.getAttribute('id')
    const passwordLabel = passwordId ? await page.locator(`label[for="${passwordId}"]`).count() : 0
    expect(passwordAriaLabel || passwordLabel > 0).toBeTruthy()
  })
  
  test('buttons should have accessible names @accessibility', async ({ page }) => {
    await page.goto('/login')
    
    await page.waitForLoadState('networkidle')
    
    // Check submit button
    const submitButton = page.locator('button[type="submit"]')
    const submitAriaLabel = await submitButton.getAttribute('aria-label')
    const submitText = await submitButton.textContent()
    expect(submitAriaLabel || submitText?.trim()).toBeTruthy()
    
    // Check toggle button
    const toggleButton = page.locator('button[name="toggle-auth-mode"]')
    const toggleAriaLabel = await toggleButton.getAttribute('aria-label')
    const toggleText = await toggleButton.textContent()
    expect(toggleAriaLabel || toggleText?.trim()).toBeTruthy()
  })
  
  test('page should have proper heading structure @accessibility', async ({ page }) => {
    await page.goto('/login')
    
    await page.waitForLoadState('networkidle')
    
    // Check for h1 heading
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
    
    // There should be at least one heading
    const headingCount = await page.locator('h1, h2, h3').count()
    expect(headingCount).toBeGreaterThan(0)
  })
})
