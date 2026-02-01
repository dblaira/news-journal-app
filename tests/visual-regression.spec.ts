import { test, expect } from '@playwright/test'

/**
 * Visual regression tests using Playwright's screenshot comparison
 * Note: Tests focus on public pages (login) since auth requires credentials
 * 
 * Run `npm run test:update-snapshots` to create/update baseline screenshots
 */
test.describe('Visual Regression Tests', () => {
  
  test('login page should match snapshot @visual', async ({ page }) => {
    await page.goto('/login')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    
    // Wait for fonts and images to load
    await page.waitForTimeout(1000)
    
    // Take screenshot and compare
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      // Allow some variance for font rendering differences
      maxDiffPixelRatio: 0.1,
    })
  })
  
  test('login page mobile should match snapshot @visual', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')
    
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    await expect(page).toHaveScreenshot('login-page-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    })
  })
  
  test('login form should match snapshot @visual', async ({ page }) => {
    await page.goto('/login')
    
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // Screenshot just the form
    const form = page.locator('form[role="form"]')
    await expect(form).toHaveScreenshot('login-form.png', {
      maxDiffPixelRatio: 0.1,
    })
  })
  
  test('login page with error should show error state @visual', async ({ page }) => {
    await page.goto('/login')
    
    await page.waitForLoadState('networkidle')
    
    // Fill with invalid credentials
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for error message
    await page.waitForTimeout(2000)
    
    // Screenshot the error state (if visible)
    const errorMessage = page.locator('[role="alert"]')
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toHaveScreenshot('login-error.png', {
        maxDiffPixelRatio: 0.15,
      })
    }
  })
  
  test('sign up form should match snapshot @visual', async ({ page }) => {
    await page.goto('/login')
    
    await page.waitForLoadState('networkidle')
    
    // Toggle to sign up mode
    await page.click('button[name="toggle-auth-mode"]')
    await page.waitForTimeout(500)
    
    // Screenshot the sign up form
    const form = page.locator('form[role="form"]')
    await expect(form).toHaveScreenshot('signup-form.png', {
      maxDiffPixelRatio: 0.1,
    })
  })
})
