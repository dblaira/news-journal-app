import { resolve } from 'path'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const EXPORT_PATH = '/Users/adamblair/Downloads/apple_health_export 2/export.xml'

const WORKOUT_TYPE_MAP: Record<string, string> = {
  HKWorkoutActivityTypeRunning: 'running',
  HKWorkoutActivityTypeCycling: 'cycling',
  HKWorkoutActivityTypeWalking: 'walking',
  HKWorkoutActivityTypeSwimming: 'swimming',
  HKWorkoutActivityTypeYoga: 'yoga',
  HKWorkoutActivityTypeHiking: 'hiking',
  HKWorkoutActivityTypeTennis: 'tennis',
  HKWorkoutActivityTypeTraditionalStrengthTraining: 'strength training',
  HKWorkoutActivityTypeFunctionalStrengthTraining: 'strength training',
  HKWorkoutActivityTypeHighIntensityIntervalTraining: 'HIIT',
  HKWorkoutActivityTypeCoreTraining: 'core training',
  HKWorkoutActivityTypeElliptical: 'elliptical',
  HKWorkoutActivityTypeStairClimbing: 'stair climbing',
  HKWorkoutActivityTypePilates: 'pilates',
  HKWorkoutActivityTypeDance: 'dance',
  HKWorkoutActivityTypePickleball: 'pickleball',
  HKWorkoutActivityTypeCooldown: 'cooldown',
  HKWorkoutActivityTypeOther: 'other',
}

const SLEEP_VALUE_MAP: Record<string, string> = {
  HKCategoryValueSleepAnalysisInBed: 'in_bed',
  HKCategoryValueSleepAnalysisAsleepUnspecified: 'asleep',
  HKCategoryValueSleepAnalysisAsleepCore: 'core_sleep',
  HKCategoryValueSleepAnalysisAsleepDeep: 'deep_sleep',
  HKCategoryValueSleepAnalysisAsleepREM: 'rem_sleep',
  HKCategoryValueSleepAnalysisAwake: 'awake',
}

interface SleepNight {
  date: string
  total_in_bed_min: number
  total_asleep_min: number
  deep_min: number
  rem_min: number
  core_min: number
  awake_min: number
  bed_start: string
  wake_end: string
  source: string
}

interface WorkoutRecord {
  date: string
  type: string
  type_raw: string
  duration_min: number
  source: string
  start_time: string
}

function parseDate(dateStr: string): string {
  return dateStr.split(' ').slice(0, 1).join('')
}

function parseTimestamp(dateStr: string): Date {
  const cleaned = dateStr.replace(/\s[+-]\d{4}$/, '')
  return new Date(cleaned)
}

function diffMinutes(start: string, end: string): number {
  const s = parseTimestamp(start)
  const e = parseTimestamp(end)
  return Math.round((e.getTime() - s.getTime()) / 60000)
}

function extractAttr(line: string, attr: string): string {
  const regex = new RegExp(`${attr}="([^"]*)"`)
  const match = line.match(regex)
  return match ? match[1] : ''
}

function parseArgs() {
  const args = process.argv.slice(2)
  let dryRun = false
  let userId = ''
  let dateFrom = '2024-06-01'

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') dryRun = true
    if (args[i] === '--user-id' && args[i + 1]) userId = args[i + 1]
    if (args[i] === '--from' && args[i + 1]) dateFrom = args[i + 1]
  }

  return { dryRun, userId, dateFrom }
}

async function main() {
  const { dryRun, userId, dateFrom } = parseArgs()

  console.log('=== Apple Health Ingestion ===')
  console.log(`File: ${EXPORT_PATH}`)
  console.log(`Date filter: ${dateFrom} forward`)
  console.log(`Dry run: ${dryRun}`)
  console.log()

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  let resolvedUserId = userId
  if (!resolvedUserId) {
    const { data: users } = await supabase.from('entries').select('user_id').limit(1)
    resolvedUserId = users?.[0]?.user_id || ''
    if (!resolvedUserId) {
      console.error('No user found. Pass --user-id')
      process.exit(1)
    }
  }
  console.log(`User: ${resolvedUserId}`)

  const sleepSegments: { date: string; start: string; end: string; value: string; source: string; mins: number }[] = []
  const workouts: WorkoutRecord[] = []
  let linesRead = 0

  console.log('Streaming XML...')
  const rl = createInterface({
    input: createReadStream(EXPORT_PATH, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    linesRead++
    if (linesRead % 5000000 === 0) console.log(`  ...${(linesRead / 1000000).toFixed(0)}M lines`)

    if (line.includes('SleepAnalysis')) {
      const startDate = extractAttr(line, 'startDate')
      const endDate = extractAttr(line, 'endDate')
      const value = extractAttr(line, 'value')
      const source = extractAttr(line, 'sourceName')
      const dateStr = parseDate(startDate)

      if (dateStr < dateFrom) continue

      const mins = diffMinutes(startDate, endDate)
      if (mins <= 0 || mins > 1440) continue

      sleepSegments.push({ date: dateStr, start: startDate, end: endDate, value, source, mins })
    }

    if (line.includes('workoutActivityType') && line.includes('<Workout ')) {
      const startDate = extractAttr(line, 'startDate')
      const typeRaw = extractAttr(line, 'workoutActivityType')
      const durationStr = extractAttr(line, 'duration')
      const source = extractAttr(line, 'sourceName')
      const dateStr = parseDate(startDate)

      if (dateStr < dateFrom) continue

      const duration = parseFloat(durationStr) || 0
      if (duration <= 0) continue

      workouts.push({
        date: dateStr,
        type: WORKOUT_TYPE_MAP[typeRaw] || typeRaw.replace('HKWorkoutActivityType', '').toLowerCase(),
        type_raw: typeRaw,
        duration_min: Math.round(duration),
        source,
        start_time: startDate,
      })
    }
  }

  console.log(`\nParsed ${linesRead.toLocaleString()} lines`)
  console.log(`Sleep segments: ${sleepSegments.length}`)
  console.log(`Workouts: ${workouts.length}`)

  // Aggregate sleep by night
  const sleepByDate = new Map<string, SleepNight>()
  for (const seg of sleepSegments) {
    const mapped = SLEEP_VALUE_MAP[seg.value] || 'unknown'
    if (!sleepByDate.has(seg.date)) {
      sleepByDate.set(seg.date, {
        date: seg.date,
        total_in_bed_min: 0,
        total_asleep_min: 0,
        deep_min: 0,
        rem_min: 0,
        core_min: 0,
        awake_min: 0,
        bed_start: seg.start,
        wake_end: seg.end,
        source: seg.source,
      })
    }
    const night = sleepByDate.get(seg.date)!

    if (mapped === 'in_bed') night.total_in_bed_min += seg.mins
    else if (mapped === 'deep_sleep') { night.deep_min += seg.mins; night.total_asleep_min += seg.mins }
    else if (mapped === 'rem_sleep') { night.rem_min += seg.mins; night.total_asleep_min += seg.mins }
    else if (mapped === 'core_sleep') { night.core_min += seg.mins; night.total_asleep_min += seg.mins }
    else if (mapped === 'asleep') night.total_asleep_min += seg.mins
    else if (mapped === 'awake') night.awake_min += seg.mins

    if (seg.start < night.bed_start) night.bed_start = seg.start
    if (seg.end > night.wake_end) night.wake_end = seg.end
  }

  const sleepNights = Array.from(sleepByDate.values()).filter(n => n.total_asleep_min > 30)

  console.log(`\nSleep nights (after aggregation): ${sleepNights.length}`)
  if (sleepNights.length > 0) {
    const sample = sleepNights[sleepNights.length - 1]
    console.log(`  Latest: ${sample.date} — ${Math.round(sample.total_asleep_min / 60 * 10) / 10}h asleep, ${Math.round(sample.deep_min)}min deep, ${Math.round(sample.rem_min)}min REM`)
  }

  console.log(`\nWorkouts (after filter): ${workouts.length}`)
  const typeCounts = new Map<string, number>()
  for (const w of workouts) typeCounts.set(w.type, (typeCounts.get(w.type) || 0) + 1)
  Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([t, c]) => console.log(`  ${t}: ${c}`))

  if (dryRun) {
    console.log('\n=== DRY RUN — no data written ===')
    return
  }

  // Build extractions
  const batchId = crypto.randomUUID()
  const extractions: {
    user_id: string
    category: string
    parent_category: string
    data: Record<string, string | number | boolean>
    confidence: number
    source_domain: string
    time_window_start: string
    time_window_end: string
    batch_id: string
    batch_size: number
  }[] = []

  for (const night of sleepNights) {
    extractions.push({
      user_id: resolvedUserId,
      category: 'sleep',
      parent_category: 'Sleep',
      data: {
        total_hours: Math.round(night.total_asleep_min / 60 * 10) / 10,
        deep_min: night.deep_min,
        rem_min: night.rem_min,
        core_min: night.core_min,
        awake_min: night.awake_min,
        in_bed_hours: Math.round(night.total_in_bed_min / 60 * 10) / 10,
      },
      confidence: 1.0,
      source_domain: 'apple_health',
      time_window_start: night.date,
      time_window_end: night.date,
      batch_id: batchId,
      batch_size: sleepNights.length + workouts.length,
    })
  }

  for (const w of workouts) {
    extractions.push({
      user_id: resolvedUserId,
      category: 'exercise',
      parent_category: 'Exercise',
      data: {
        type: w.type,
        duration_min: w.duration_min,
        source: w.source,
      },
      confidence: 1.0,
      source_domain: 'apple_health',
      time_window_start: w.date,
      time_window_end: w.date,
      batch_id: batchId,
      batch_size: sleepNights.length + workouts.length,
    })
  }

  console.log(`\nInserting ${extractions.length} extractions...`)

  // Insert in chunks of 500
  let inserted = 0
  for (let i = 0; i < extractions.length; i += 500) {
    const chunk = extractions.slice(i, i + 500)
    const { error } = await supabase.from('extractions').insert(chunk)
    if (error) {
      console.error(`Insert error at chunk ${i}:`, error.message)
      break
    }
    inserted += chunk.length
    if (inserted % 1000 === 0 || inserted === extractions.length) {
      console.log(`  ${inserted} / ${extractions.length}`)
    }
  }

  console.log(`\n=== Done ===`)
  console.log(`Batch ID: ${batchId}`)
  console.log(`Sleep nights inserted: ${sleepNights.length}`)
  console.log(`Workouts inserted: ${workouts.length}`)
  console.log(`Total: ${inserted}`)
}

main().catch(console.error)
