/**
 * Headless browser PDF generator.
 *
 * Uses puppeteer-core to launch a headless Chromium instance, feeds it
 * self-contained HTML (from render-entry-html.tsx via renderToString),
 * and calls page.pdf() to produce a high-fidelity PDF.
 *
 * Environment handling:
 *   - LOCAL (dev): Uses your system Chrome installation
 *   - VERCEL (production): Uses @sparticuz/chromium-min which downloads
 *     a minimal Chromium binary at cold start
 */
import puppeteer, { type Browser, type LaunchOptions } from 'puppeteer-core'
import { Entry, WeeklyTheme } from '@/types'
import {
  renderEntryHtml,
  renderMultiEntryHtml,
  renderWeeklyThemeHtml,
} from './render-entry-html'

// ─── Chromium executable resolution ────────────────────────────────────

/**
 * Returns the path to a local Chrome/Chromium executable.
 * Checks common install locations on macOS, Linux, and Windows.
 */
function getLocalChromePath(): string {
  const fs = require('fs')

  const candidates = [
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    // Windows (WSL paths)
    '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
    '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  throw new Error(
    'No local Chrome/Chromium found. Install Google Chrome or set CHROME_EXECUTABLE_PATH env var.'
  )
}

/**
 * Detect whether we're running on Vercel (or any AWS Lambda-like environment).
 */
function isServerless(): boolean {
  return !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
  )
}

/**
 * Get Puppeteer launch options based on the environment.
 */
async function getLaunchOptions(): Promise<LaunchOptions> {
  if (isServerless()) {
    // Production: use @sparticuz/chromium-min
    const chromium = await import('@sparticuz/chromium-min')

    const executablePath = await chromium.default.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar'
    )

    return {
      args: chromium.default.args,
      defaultViewport: { width: 1280, height: 900 },
      executablePath,
      headless: true,
    }
  }

  // Local development: use system Chrome
  const executablePath = process.env.CHROME_EXECUTABLE_PATH || getLocalChromePath()

  return {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
    executablePath,
    headless: true,
  }
}

// ─── Core PDF generation ───────────────────────────────────────────────

/**
 * Shared logic: launch browser, set HTML content, wait for fonts, generate PDF.
 */
async function htmlToPdf(html: string): Promise<Buffer> {
  let browser: Browser | null = null

  try {
    const launchOptions = await getLaunchOptions()
    browser = await puppeteer.launch(launchOptions)

    const page = await browser.newPage()

    // Set content and wait for network to settle (fonts load via Google Fonts CDN)
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Extra safety: wait for all fonts to finish loading
    await page.evaluate(() => document.fonts.ready)

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
        right: '0.5in',
      },
    })

    return Buffer.from(pdfBuffer)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// ─── Public API (mirrors generate-pdf-serverless.ts interface) ─────────

export async function generateEntryPDF(entry: Entry): Promise<Buffer> {
  const html = await renderEntryHtml(entry)
  return htmlToPdf(html)
}

export async function generateMultiEntryPDF(entries: Entry[]): Promise<Buffer> {
  const html = await renderMultiEntryHtml(entries)
  return htmlToPdf(html)
}

export async function generateWeeklyPDF(theme: WeeklyTheme, entries: Entry[]): Promise<Buffer> {
  const html = await renderWeeklyThemeHtml(theme, entries)
  return htmlToPdf(html)
}
