import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEntryDateLong(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'Date pending'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatEntryDateShort(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'Today'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function stripHtml(html: string): string {
  if (!html) return ''
  // Remove HTML tags and decode common entities
  return html
    .replace(/<[^>]*>/g, ' ')  // Replace tags with space
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim()
}

export function truncate(text: string, limit: number): string {
  if (!text) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= limit) return clean
  return `${clean.slice(0, limit - 1)}…`
}

export function truncateHtml(html: string, limit: number): string {
  return truncate(stripHtml(html), limit)
}

