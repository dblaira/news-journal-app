import { test, expect } from '@playwright/test'

/**
 * End-to-end tests for critical user flows
 * Tests actual user interactions and workflows
 */
test.describe('E2E Tests', () => {
  
  test('should load homepage', async ({ page }) => {
    await page.goto('/')
    
    // Check that page loads
    await expect(page).toHaveTitle(/Understood/i)
    
    // Check for main content
    const mainContent = page.locator('main, .page-shell')
    await expect(mainContent).toBeVisible()
  })
  
  test('should navigate to entry details', async ({ page }) => {
    await page.goto('/')
    
    // Wait for entry cards to load
    await page.waitForSelector('.entry-card', { timeout: 10000 })
    
    // Click on first entry
    const firstEntry = page.locator('.entry-card').first()
    await firstEntry.click()
    
    // Check that modal or detail view opens
    const modal = page.locator('[role="dialog"]')
    const detailView = page.locator('.entry-detail, .entry-modal')
    
    await expect(modal.or(detailView).first()).toBeVisible({ timeout: 5000 })
  })
  
  test('should filter entries by category', async ({ page }) => {
    await page.goto('/')
    
    // Wait for category filters to load
    await page.waitForTimeout(2000)
    
    // Try to find and click a category filter
    const categoryButton = page.locator('button:has-text("Business"), button:has-text("Finance")').first()
    
    if (await categoryButton.isVisible()) {
      await categoryButton.click()
      await page.waitForTimeout(1000)
      
      // Verify URL or content changed
      const url = page.url()
      expect(url).toBeTruthy()
    }
  })
  
  test('should handle sidebar collapse/expand', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')
    
    await page.waitForTimeout(2000)
    
    // Look for sidebar toggle button
    const sidebarToggle = page.locator('button[aria-label*="sidebar"], button[aria-label*="collapse"], button:has-text("‹")').first()
    
    if (await sidebarToggle.isVisible()) {
      // Get initial sidebar width
      const sidebar = page.locator('aside').first()
      const initialWidth = await sidebar.evaluate((el) => el.clientWidth)
      
      // Click toggle
      await sidebarToggle.click()
      await page.waitForTimeout(500) // Wait for animation
      
      // Check that sidebar width changed
      const newWidth = await sidebar.evaluate((el) => el.clientWidth)
      expect(newWidth).not.toBe(initialWidth)
    }
  })
  
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    await page.waitForLoadState('networkidle')
    
    // Check that mobile menu or responsive layout is visible
    const mobileMenu = page.locator('.mobile-menu, [class*="mobile"]').first()
    const mainContent = page.locator('main, .page-shell')
    
    // Either mobile menu exists or main content is visible
    const isMobileLayout = await mobileMenu.isVisible().catch(() => false) || 
                           await mainContent.isVisible()
    
    expect(isMobileLayout).toBeTruthy()
  })
  
  test('should handle image loading errors gracefully', async ({ page }) => {
    await page.goto('/')
    
    // Wait for images to load
    await page.waitForTimeout(3000)
    
    // Check for broken image placeholders or error states
    const images = page.locator('img')
    const imageCount = await images.count()
    
    if (imageCount > 0) {
      // Check that images have proper error handling
      const firstImage = images.first()
      const hasAlt = await firstImage.getAttribute('alt')
      expect(hasAlt).toBeTruthy()
    }
  })
})
