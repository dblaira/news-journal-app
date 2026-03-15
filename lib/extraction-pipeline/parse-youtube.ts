import { readFileSync } from 'fs'
import { resolve } from 'path'
import { NormalizedRecord } from './types'

const ENTRY_REGEX = /class="content-cell mdl-cell mdl-cell--6-col mdl-typography--body-1">(Watched|Viewed)\s*<a href="(https?:\/\/[^"]+)"[^>]*>([^<]*)<\/a>(?:<br>)?(?:<a href="https:\/\/www\.youtube\.com\/channel\/[^"]*">([^<]*)<\/a>)?(?:<br>)?([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4},\s+\d{1,2}:\d{2}:\d{2}\s+[AP]M\s+\w+)/g

function parseTimestamp(raw: string): string | null {
  const cleaned = raw.replace(/\s+PST$/, ' GMT-0800')
    .replace(/\s+PDT$/, ' GMT-0700')
    .replace(/\s+EST$/, ' GMT-0500')
    .replace(/\s+EDT$/, ' GMT-0400')
    .replace(/\s+CST$/, ' GMT-0600')
    .replace(/\s+CDT$/, ' GMT-0500')
    .replace(/\s+MST$/, ' GMT-0700')
    .replace(/\s+MDT$/, ' GMT-0600')

  const date = new Date(cleaned)
  if (isNaN(date.getTime())) return null
  return date.toISOString()
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&emsp;/g, ' ')
    .replace(/&nbsp;/g, ' ')
}

function extractVideoId(url: string): string {
  const watchMatch = url.match(/watch\?v=([^&]+)/)
  if (watchMatch) return watchMatch[1]
  const shortMatch = url.match(/youtu\.be\/([^?]+)/)
  if (shortMatch) return shortMatch[1]
  return ''
}

export function parseYouTube(projectRoot: string): NormalizedRecord[] {
  const filePath = resolve(
    projectRoot,
    'Feb_Metadata/Takeout-3/YouTube and YouTube Music/history/watch-history.html'
  )

  console.log('  Reading watch history HTML...')
  const html = readFileSync(filePath, 'utf-8')
  console.log(`  File size: ${(html.length / 1024 / 1024).toFixed(1)} MB`)

  const records: NormalizedRecord[] = []
  let match: RegExpExecArray | null

  const regex = new RegExp(ENTRY_REGEX.source, ENTRY_REGEX.flags)
  while ((match = regex.exec(html)) !== null) {
    const action = match[1]
    const url = match[2]
    const title = decodeHTMLEntities(match[3] || '').trim()
    const channel = decodeHTMLEntities(match[4] || '').trim()
    const rawTimestamp = match[5]

    const timestamp = parseTimestamp(rawTimestamp)
    if (!timestamp) continue
    if (!title) continue

    const videoId = extractVideoId(url)

    const content: Record<string, string | number | boolean> = {
      title,
      action: action.toLowerCase(),
    }
    if (channel) content.channel = channel
    if (videoId) content.video_id = videoId

    records.push({
      timestamp,
      source_domain: 'youtube',
      content,
    })
  }

  records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  console.log(`  Total YouTube records: ${records.length}`)
  if (records.length > 0) {
    console.log(`  Date range: ${records[0].timestamp.slice(0, 10)} to ${records[records.length - 1].timestamp.slice(0, 10)}`)
    const channels = new Set(records.map(r => r.content.channel).filter(Boolean))
    console.log(`  Unique channels: ${channels.size}`)
  }

  return records
}
