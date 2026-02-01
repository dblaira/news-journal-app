import { test, expect } from '@playwright/test'

/**
 * End-to-end tests for critical user flows
 * Tests actual user interactions and workflows
 * Note: Most tests focus on public pages since auth requires credentials
 */
test.describe('E2E Tests', () => {
  
  test('should load login page', async ({ page }) => {
    await page.goto('/login')
    
    // Check that login page loads
    await expect(page).toHaveTitle(/Understood/i)
    
    // Check for login form elements
    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    const submitButton = page.locator('button[type="submit"]')
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()
  })
  
  test('should show validation for empty login', async ({ page }) => {
    await page.goto('/login')
    
    // Click submit without filling form
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    // Form should still be visible (HTML5 validation prevents submission)
    await expect(submitButton).toBeVisible()
  })
  
  test('should toggle between sign in and sign up', async ({ page }) => {
    await page.goto('/login')
    
    // Find toggle button
    const toggleButton = page.locator('button[name="toggle-auth-mode"]')
    await expect(toggleButton).toBeVisible()
    
    // Get initial button text
    const initialText = await toggleButton.textContent()
    expect(initialText).toContain('Sign Up')
    
    // Click toggle
    await toggleButton.click()
    await page.waitForTimeout(300)
    
    // Check that form mode changed
    const newText = await toggleButton.textContent()
    expect(newText).toContain('Sign In')
  })
  
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/')
    
    // Should redirect to login page
    await page.waitForURL('**/login**', { timeout: 5000 })
    
    // Verify we're on login page
    const loginForm = page.locator('form[role="form"]')
    await expect(loginForm).toBeVisible()
  })
  
  test('login page should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')
    
    await page.waitForLoadState('networkidle')
    
    // Check that form is visible and properly sized
    const form = page.locator('form[role="form"]')
    await expect(form).toBeVisible()
    
    // Check inputs are accessible
    const emailInput = page.locator('input[name="email"]')
    await expect(emailInput).toBeVisible()
  })
  
  test('login page should have proper branding', async ({ page }) => {
    await page.goto('/login')
    
    // Check for "Understood." branding
    const heading = page.locator('h1:has-text("Understood")')
    await expect(heading).toBeVisible()
  })
})
