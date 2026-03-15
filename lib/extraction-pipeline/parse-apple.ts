import { readFileSync, readdirSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import { NormalizedRecord } from './types'
import { parseCSV } from './csv-utils'

const CALENDAR_DIR = 'Feb_Metadata/iCloud Calendars and Reminders'
const NOTES_DIR = 'Feb_Metadata/iCloud Notes'

interface ICSEvent {
  summary: string
  dtstart: string
  dtend: string
  location?: string
  description?: string
  attendees: string[]
  calendarName: string
}

function unfoldICS(raw: string): string {
  return raw
    .replace(/\r\n[ \t]/g, '')
    .replace(/\n[ \t]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
}

function parseICSDate(value: string): string | null {
  const cleaned = value.replace(/^[^:]*:/, '')

  const fullMatch = cleaned.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/)
  if (fullMatch) {
    const [, y, m, d, h, min, s] = fullMatch
    return new Date(`${y}-${m}-${d}T${h}:${min}:${s}Z`).toISOString()
  }

  const dateOnly = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (dateOnly) {
    const [, y, m, d] = dateOnly
    return new Date(`${y}-${m}-${d}T00:00:00Z`).toISOString()
  }

  return null
}

function parseICSFile(filePath: string, calendarName: string): ICSEvent[] {
  let raw: string
  try {
    raw = readFileSync(filePath, 'utf-8')
  } catch {
    return []
  }

  const unfolded = unfoldICS(raw)
  const events: ICSEvent[] = []
  const blocks = unfolded.split('BEGIN:VEVENT')

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0]
    if (!block) continue

    const lines = block.split('\n')
    let summary = ''
    let dtstart = ''
    let dtend = ''
    let location = ''
    let description = ''
    const attendees: string[] = []

    for (const line of lines) {
      if (line.startsWith('SUMMARY:')) {
        summary = line.slice(8).trim()
      } else if (line.startsWith('DTSTART')) {
        const parsed = parseICSDate(line)
        if (parsed) dtstart = parsed
      } else if (line.startsWith('DTEND')) {
        const parsed = parseICSDate(line)
        if (parsed) dtend = parsed
      } else if (line.startsWith('LOCATION')) {
        location = line.replace(/^LOCATION[^:]*:/, '').trim()
      } else if (line.startsWith('DESCRIPTION:')) {
        description = line.slice(12).trim()
      } else if (line.startsWith('ATTENDEE')) {
        const cnMatch = line.match(/CN=([^;]+)/)
        if (cnMatch) attendees.push(cnMatch[1])
      }
    }

    if (!summary || !dtstart) continue

    events.push({
      summary,
      dtstart,
      dtend,
      location: location || undefined,
      description: description || undefined,
      attendees,
      calendarName,
    })
  }

  return events
}

function calendarDisplayName(filename: string): string {
  const name = filename.replace('.ics', '')
  const nameMap: Record<string, string> = {
    'Home': 'Home',
    'Calendar': 'Default',
    'Birthdays': 'Birthdays',
  }
  return nameMap[name] || name
}

export function parseAppleCalendar(projectRoot: string): NormalizedRecord[] {
  const calDir = resolve(projectRoot, CALENDAR_DIR)
  const files = readdirSync(calDir).filter(f => f.endsWith('.ics'))

  console.log(`  Found ${files.length} calendar files.`)

  const records: NormalizedRecord[] = []

  for (const file of files) {
    if (file === 'Birthdays.ics') continue
    if (file.includes('Reminders')) continue

    const calName = calendarDisplayName(file)
    const filePath = join(calDir, file)
    const events = parseICSFile(filePath, calName)

    console.log(`  ${calName}: ${events.length} events`)

    for (const event of events) {
      const content: Record<string, string | number | boolean> = {
        summary: event.summary,
        calendar: event.calendarName,
      }

      if (event.location) content.location = event.location
      if (event.attendees.length > 0) {
        content.attendee_count = event.attendees.length
        content.attendees = event.attendees.slice(0, 5).join(', ')
      }
      if (event.dtend) {
        const start = new Date(event.dtstart).getTime()
        const end = new Date(event.dtend).getTime()
        const durationMin = Math.round((end - start) / 60000)
        if (durationMin > 0) content.duration_minutes = durationMin
      }

      records.push({
        timestamp: event.dtstart,
        source_domain: 'apple_calendar',
        content,
      })
    }
  }

  records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  console.log(`  Total calendar records: ${records.length}`)
  if (records.length > 0) {
    console.log(`  Date range: ${records[0].timestamp.slice(0, 10)} to ${records[records.length - 1].timestamp.slice(0, 10)}`)
  }

  return records
}

export function parseAppleNotes(projectRoot: string): NormalizedRecord[] {
  const notesDir = resolve(projectRoot, NOTES_DIR)
  const detailsPath = join(notesDir, 'Notes Details.csv')

  if (!existsSync(detailsPath)) {
    console.log('  Notes Details.csv not found, skipping.')
    return []
  }

  const detailsRows = parseCSV(readFileSync(detailsPath, 'utf-8'))
  const records: NormalizedRecord[] = []

  const notesFolder = join(notesDir, 'Notes')
  if (!existsSync(notesFolder)) {
    console.log('  Notes/ folder not found, skipping.')
    return []
  }

  for (const row of detailsRows) {
    const title = (row['Title'] || '').trim()
    const createdOn = (row[' Created On'] || row['Created On'] || '').trim()
    const deleted = (row[' Deleted'] || row['Deleted'] || '').trim()

    if (!title || !createdOn) continue
    if (deleted === 'Yes') continue

    const noteFolderPath = join(notesFolder, title)
    const txtPath = join(noteFolderPath, `${title}.txt`)

    let noteContent = ''
    try {
      if (existsSync(txtPath)) {
        noteContent = readFileSync(txtPath, 'utf-8').trim()
      }
    } catch {
      continue
    }

    if (!noteContent || noteContent.length < 20) continue

    const dateParts = createdOn.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/)
    if (!dateParts) continue
    const [, month, day, year, hour, min, sec] = dateParts
    const timestamp = new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`).toISOString()

    const truncatedContent = noteContent.length > 2000
      ? noteContent.slice(0, 2000) + '...'
      : noteContent

    records.push({
      timestamp,
      source_domain: 'apple_notes',
      content: {
        title,
        text: truncatedContent,
        char_count: noteContent.length,
      },
    })
  }

  records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  console.log(`  Total notes with content: ${records.length}`)
  if (records.length > 0) {
    console.log(`  Date range: ${records[0].timestamp.slice(0, 10)} to ${records[records.length - 1].timestamp.slice(0, 10)}`)
  }

  return records
}
