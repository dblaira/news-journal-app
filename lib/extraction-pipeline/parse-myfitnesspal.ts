import { readFileSync } from 'fs'
import { resolve } from 'path'
import { NormalizedRecord } from './types'
import { parseCSV } from './csv-utils'

const MFP_DIR = 'Feb_Metadata/MyFitnessPal_File-Export-2024-06-13-to-2026-03-14'

function parseNutrition(projectRoot: string): NormalizedRecord[] {
  const filePath = resolve(projectRoot, MFP_DIR, 'MyFitnessPal_Nutrition-Summary-2024-06-13-to-2026-03-14.csv')
  const rows = parseCSV(readFileSync(filePath, 'utf-8'))
  const records: NormalizedRecord[] = []

  for (const row of rows) {
    const date = row['Date']
    if (!date) continue

    const content: Record<string, string | number | boolean> = {
      record_type: 'nutrition',
      meal: row['Meal'] || '',
    }

    if (row['Time']) content.time = row['Time']

    const numericFields = [
      'Calories', 'Fat (g)', 'Protein (g)', 'Carbohydrates (g)',
      'Fiber', 'Sugar', 'Sodium (mg)', 'Cholesterol',
      'Saturated Fat', 'Potassium',
    ]

    for (const field of numericFields) {
      const val = parseFloat(row[field])
      if (!isNaN(val) && val !== 0) {
        content[field.toLowerCase().replace(/[() ]/g, '_').replace(/__+/g, '_')] = val
      }
    }

    if (row['Note']) content.note = row['Note']

    records.push({
      timestamp: new Date(date + 'T12:00:00Z').toISOString(),
      source_domain: 'myfitnesspal',
      content,
    })
  }

  return records
}

function parseExercise(projectRoot: string): NormalizedRecord[] {
  const filePath = resolve(projectRoot, MFP_DIR, 'MyFitnessPal_Exercise-Summary-2024-06-13-to-2026-03-14.csv')
  const rows = parseCSV(readFileSync(filePath, 'utf-8'))
  const records: NormalizedRecord[] = []

  for (const row of rows) {
    const date = row['Date']
    if (!date) continue

    const exercise = row['Exercise'] || ''
    if (exercise === 'MFP iOS calorie adjustment') continue

    const content: Record<string, string | number | boolean> = {
      record_type: 'exercise',
      exercise,
      type: row['Type'] || '',
    }

    const calories = parseFloat(row['Exercise Calories'])
    if (!isNaN(calories)) content.calories = calories

    const minutes = parseFloat(row['Exercise Minutes'])
    if (!isNaN(minutes)) content.minutes = minutes

    const sets = parseFloat(row['Sets'])
    if (!isNaN(sets)) content.sets = sets

    const reps = parseFloat(row['Reps Per Set'])
    if (!isNaN(reps)) content.reps_per_set = reps

    const pounds = parseFloat(row['Pounds'])
    if (!isNaN(pounds)) content.pounds = pounds

    const steps = parseFloat(row['Steps'])
    if (!isNaN(steps)) content.steps = steps

    if (row['Note']) content.note = row['Note']

    records.push({
      timestamp: new Date(date + 'T12:00:00Z').toISOString(),
      source_domain: 'myfitnesspal',
      content,
    })
  }

  return records
}

function parseMeasurements(projectRoot: string): NormalizedRecord[] {
  const filePath = resolve(projectRoot, MFP_DIR, 'MyFitnessPal_Measurement-Summary-2024-06-13-to-2026-03-14.csv')
  const rows = parseCSV(readFileSync(filePath, 'utf-8'))
  const records: NormalizedRecord[] = []

  for (const row of rows) {
    const date = row['Date']
    if (!date) continue

    const weight = parseFloat(row['Weight'])
    if (isNaN(weight)) continue

    records.push({
      timestamp: new Date(date + 'T08:00:00Z').toISOString(),
      source_domain: 'myfitnesspal',
      content: {
        record_type: 'measurement',
        weight_lbs: weight,
      },
    })
  }

  return records
}

export function parseMyFitnessPal(projectRoot: string): NormalizedRecord[] {
  console.log('  Parsing nutrition data...')
  const nutrition = parseNutrition(projectRoot)
  console.log(`  Found ${nutrition.length} nutrition records.`)

  console.log('  Parsing exercise data...')
  const exercise = parseExercise(projectRoot)
  console.log(`  Found ${exercise.length} exercise records.`)

  console.log('  Parsing measurement data...')
  const measurements = parseMeasurements(projectRoot)
  console.log(`  Found ${measurements.length} measurement records.`)

  const all = [...nutrition, ...exercise, ...measurements].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  console.log(`  Total MyFitnessPal records: ${all.length}`)
  if (all.length > 0) {
    console.log(`  Date range: ${all[0].timestamp.slice(0, 10)} to ${all[all.length - 1].timestamp.slice(0, 10)}`)
  }

  return all
}
