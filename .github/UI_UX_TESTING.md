# UI/UX Testing Guide

This guide covers the automated UI/UX testing setup for the news-journal-app, including visual regression, accessibility, and end-to-end testing.

## Overview

We use **Playwright** as our primary testing framework, which provides:
- ✅ **Visual Regression Testing** - Screenshot comparisons to catch UI changes
- ✅ **Accessibility Testing** - WCAG compliance checks using axe-core
- ✅ **E2E Testing** - User flow validation
- ✅ **Cross-browser Testing** - Chrome, Firefox, Safari, Mobile

## Quick Start

### Install Dependencies

```bash
npm install
```

This will install Playwright and all testing dependencies.

### Run Tests Locally

```bash
# Run all tests
npm test

# Run with UI mode (interactive)
npm run test:ui

# Run only visual regression tests
npm run test:visual

# Run only accessibility tests
npm run test:accessibility

# Update visual snapshots (after UI changes)
npm run test:update-snapshots

# View test report
npm run test:report
```

## Test Structure

```
tests/
├── accessibility.spec.ts    # Accessibility tests (WCAG compliance)
├── visual-regression.spec.ts # Visual regression tests (screenshot comparisons)
└── e2e.spec.ts              # End-to-end user flow tests
```

## Visual Regression Testing

Visual regression tests capture screenshots and compare them to baseline images.

### How It Works

1. **First Run**: Creates baseline screenshots
2. **Subsequent Runs**: Compares new screenshots to baselines
3. **Failures**: Highlights visual differences

### Updating Baselines

When you intentionally change UI:

```bash
npm run test:update-snapshots
```

This updates the baseline images in `tests/__snapshots__/`.

### Best Practices

- ✅ Update snapshots after intentional UI changes
- ✅ Review visual diffs carefully before accepting
- ✅ Test on multiple viewport sizes (mobile, tablet, desktop)
- ✅ Disable animations for consistent screenshots

## Accessibility Testing

Accessibility tests use **axe-core** to check WCAG compliance.

### What Gets Tested

- ✅ Color contrast ratios
- ✅ Keyboard navigation
- ✅ ARIA labels and roles
- ✅ Image alt text
- ✅ Form labels
- ✅ Focus indicators
- ✅ Semantic HTML

### Running Accessibility Tests

```bash
npm run test:accessibility
```

### Fixing Accessibility Issues

1. Review the test output for violations
2. Fix the issues in your code
3. Re-run tests to verify fixes

Common fixes:
- Add `alt` attributes to images
- Add `aria-label` to interactive elements
- Ensure proper heading hierarchy
- Add focus styles to interactive elements

## E2E Testing

End-to-end tests validate critical user workflows.

### Current Test Coverage

- ✅ Homepage loading
- ✅ Entry detail navigation
- ✅ Category filtering
- ✅ Sidebar interactions
- ✅ Mobile responsiveness
- ✅ Error handling

### Adding New E2E Tests

Create a new test in `tests/e2e.spec.ts`:

```typescript
test('should perform some action', async ({ page }) => {
  await page.goto('/')
  // Your test code here
})
```

## GitHub Actions Integration

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request
- Manual trigger via workflow_dispatch

### Viewing Test Results

1. Go to the "Actions" tab in GitHub
2. Click on a workflow run
3. View individual test job results
4. Download artifacts for detailed reports

### Test Artifacts

Each test run produces:
- HTML test reports
- Screenshots of failures
- Video recordings of failed tests
- Accessibility violation reports

## Configuration

### Playwright Config (`playwright.config.ts`)

Key settings:
- **Base URL**: `http://localhost:3000` (local) or CI URL
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Retries**: 2 retries on CI
- **Screenshots**: On failure only
- **Videos**: Retained on failure

### Visual Comparison Threshold

Default threshold: `0.2` (20% pixel difference allowed)

Adjust in `playwright.config.ts`:
```typescript
expect: {
  toHaveScreenshot: {
    threshold: 0.2, // Lower = stricter
  },
}
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test'

test('should do something', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.some-element')).toBeVisible()
})
```

### Visual Regression Test

```typescript
test('component visual snapshot @visual', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.component')).toHaveScreenshot('component.png')
})
```

### Accessibility Test

```typescript
import AxeBuilder from '@axe-core/playwright'

test('page should be accessible @accessibility', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
```

## Troubleshooting

### Tests Fail Locally But Pass in CI

- Check environment variables
- Verify local dev server is running
- Check browser versions match

### Visual Tests Fail After UI Changes

```bash
# Update snapshots
npm run test:update-snapshots
```

### Accessibility Tests Fail

1. Review violation details in test output
2. Fix the accessibility issues
3. Re-run tests

### Tests Timeout

- Increase timeout in test: `test.setTimeout(60000)`
- Check if dev server is running
- Verify network requests complete

## Best Practices

### Visual Regression

1. **Update snapshots intentionally** - Don't auto-update without review
2. **Test responsive breakpoints** - Mobile, tablet, desktop
3. **Disable animations** - For consistent screenshots
4. **Review diffs carefully** - Ensure changes are expected

### Accessibility

1. **Fix violations immediately** - Don't ignore accessibility issues
2. **Test keyboard navigation** - Ensure all features are keyboard accessible
3. **Check color contrast** - Use tools to verify contrast ratios
4. **Test with screen readers** - When possible, manual testing helps

### E2E Tests

1. **Test critical paths** - Focus on user workflows
2. **Keep tests fast** - Don't test everything, test what matters
3. **Use data-testid** - For reliable element selection
4. **Wait for elements** - Use `waitForSelector` instead of fixed timeouts

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Visual Regression Testing Guide](https://playwright.dev/docs/test-screenshots)

## Next Steps

1. ✅ Run tests locally to verify setup
2. ✅ Update visual snapshots for current UI
3. ✅ Fix any accessibility violations
4. ✅ Add tests for new features as you build them
5. ✅ Review test results in GitHub Actions

---

**Note**: Tests are designed to catch regressions and ensure quality. They should be updated as your UI evolves, but always review changes before accepting them.
