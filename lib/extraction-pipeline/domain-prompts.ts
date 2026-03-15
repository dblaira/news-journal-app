import { TimeWindowBatch, SourceDomain } from './types'
import { formatWindowLabel } from './batcher'

const SEED_CATEGORIES = `- **nutrition**: food, drink, meals, supplements, fasting, diet choices
- **exercise**: workouts, movement, gym, sports, physical activity, skipping activity
- **purchase**: spending, buying, orders, subscriptions, financial transactions
- **affect**: emotional state, mood, feelings, energy level, mental state
- **belief**: convictions, values, worldview shifts, identity statements
- **ambition**: goals, aspirations, plans, intentions, desires for the future
- **insight**: realizations, patterns noticed, cross-domain tensions, contradictions
- **social**: people, relationships, interactions, conversations, social dynamics
- **sleep**: rest, sleep quality, naps, fatigue, insomnia, sleep schedule
- **health**: symptoms, conditions, medications, doctor visits, body state
- **work**: professional tasks, projects, career moves, productivity, meetings
- **learning**: books, courses, tutorials, skill development, education`

const OUTPUT_FORMAT = `Return a JSON array. Each element:

{
  "category": "category_name",
  "data": { "key": "value", "key2": "value2" },
  "confidence": 1.0,
  "source_text": "brief description of what records this extraction came from"
}

If no meaningful patterns are found, return an empty array: []

Return ONLY the JSON array. No markdown fences. No explanation.`

function formatRecordsForPrompt(batch: TimeWindowBatch): string {
  return batch.records.map((r, i) => {
    const date = new Date(r.timestamp).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      timeZone: 'UTC',
    })
    const fields = Object.entries(r.content)
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n')
    return `[${i + 1}] ${date}\n${fields}`
  }).join('\n\n')
}

function buildAmazonPrompt(batch: TimeWindowBatch): string {
  const windowLabel = formatWindowLabel(batch, 'month')
  const records = formatRecordsForPrompt(batch)

  return `You are a structured data extractor analyzing Amazon purchase history for a personal analytics system.

## Context

You are looking at ${batch.records.length} Amazon orders from **${windowLabel}**. This is a shared household account (male and female). Do NOT filter by gender — extract everything.

## Your Job

Read the purchase records below. Identify patterns, behaviors, and themes across this time window. A single order means little — look for what the collection reveals about purchasing behavior, priorities, and lifestyle.

## What to Extract

- **Spending patterns**: total spend estimates, high vs. low spend periods, price sensitivity
- **Product category clusters**: health/supplements, home goods, tech, food/grocery, personal care, fitness, books/media, baby/kids, pets, etc.
- **Recurring purchases**: items bought repeatedly (subscriptions, replenishments)
- **One-off purchases**: unusual or significant single purchases
- **Lifestyle signals**: what the purchases collectively say about priorities, interests, life stage
- **Cross-category tensions**: e.g., buying health supplements AND junk food in the same window

## Categories

Start with these seed categories, but propose new ones if the data demands it:

${SEED_CATEGORIES}

## Extraction Rules

1. **Produce multiple extractions per window.** A month of orders should yield 3–15 extractions depending on variety.
2. **Data is key-value pairs.** Keys should be short, descriptive, lowercase. Values should be concrete — strings, numbers, or booleans. No nested objects.
3. **source_text should summarize** which orders this extraction comes from (e.g., "3 supplement orders: collagen, probiotics, vitamin D").
4. **Confidence scoring:**
   - **1.0** = directly stated in data (e.g., product name clearly indicates category)
   - **0.7** = strongly implied (e.g., multiple health products suggest health focus)
   - **0.4** = loosely inferred (e.g., timing of purchases suggests seasonal behavior)

## Output Format

${OUTPUT_FORMAT}

## Purchase Records — ${windowLabel}

${records}`
}

function buildYouTubePrompt(batch: TimeWindowBatch): string {
  const windowLabel = formatWindowLabel(batch, 'week')
  const records = formatRecordsForPrompt(batch)

  return `You are a structured data extractor analyzing YouTube watch history for a personal analytics system.

## Context

You are looking at ${batch.records.length} YouTube videos watched during **${windowLabel}**.

## Your Job

Read the watch history below. Identify patterns in attention, interests, and behavior. A single video means little — look for what the collection reveals about this person's interests, emotional state, and attention patterns.

## What to Extract

- **Topic clusters**: AI/tech, sports, entertainment, music, self-improvement, comedy, news, finance, fitness, cooking, etc.
- **Channel loyalty**: channels watched repeatedly — these indicate sustained interest
- **Binge sessions**: many videos from the same channel or topic in a short span
- **Attention rhythm**: time of day patterns (morning learning vs. evening entertainment), day of week patterns
- **Emotional state signals**: comfort watching (familiar channels, rewatching), learning mode (tutorials, explainers), escapism (entertainment, music), productivity (how-to, career)
- **Interest shifts**: new topics appearing, old topics dropping off

## Categories

Start with these seed categories, but propose new ones if the data demands it:

${SEED_CATEGORIES}

## Extraction Rules

1. **Produce multiple extractions per window.** A week of watching should yield 3–12 extractions.
2. **Data is key-value pairs.** Keys: short, descriptive, lowercase. Values: concrete strings, numbers, or booleans.
3. **source_text should summarize** which videos this extraction comes from (e.g., "5 videos from ByteByteGo on system design").
4. **Confidence scoring:**
   - **1.0** = directly observable (e.g., 8 sports videos = sports interest)
   - **0.7** = strongly implied (e.g., late-night comedy suggests unwinding)
   - **0.4** = loosely inferred (e.g., mix of self-help content suggests reflection period)

## Output Format

${OUTPUT_FORMAT}

## Watch History — ${windowLabel}

${records}`
}

function buildMyFitnessPalPrompt(batch: TimeWindowBatch): string {
  const windowLabel = formatWindowLabel(batch, 'week')
  const records = formatRecordsForPrompt(batch)

  return `You are a structured data extractor analyzing MyFitnessPal health and nutrition data for a personal analytics system.

## Context

You are looking at ${batch.records.length} MyFitnessPal records from **${windowLabel}**. These include food diary entries, exercise logs, and weight measurements.

## Your Job

Read the health data below. Identify patterns in nutrition, exercise, and body composition. Individual meals mean little — look for what the week reveals about eating habits, workout consistency, and health trajectory.

## What to Extract

- **Nutrition consistency**: are meals being logged consistently? gaps in tracking?
- **Calorie/macro trends**: average daily intake, protein adequacy, carb/fat balance
- **Meal timing**: breakfast consistency, late-night eating, meal frequency
- **Exercise frequency and type**: how often, what kind, duration, intensity
- **Weight trajectory**: trend direction, rate of change, plateau signals
- **Food category patterns**: lots of protein shakes = fitness focus, lots of takeout = convenience eating
- **Cheat day signals**: sudden calorie spikes, irregular eating patterns
- **Supplement usage**: protein powders, vitamins appearing in food logs

## Categories

Start with these seed categories, but propose new ones if the data demands it:

${SEED_CATEGORIES}

## Extraction Rules

1. **Produce multiple extractions per window.** A week of health data should yield 3–10 extractions.
2. **Data is key-value pairs.** Keys: short, descriptive, lowercase. Values: concrete strings, numbers, or booleans.
3. **Include numbers when meaningful** (e.g., avg_daily_calories: 2100, workout_count: 4).
4. **source_text should summarize** the data this extraction comes from (e.g., "5 days of food logging averaging 2100 cal/day").
5. **Confidence scoring:**
   - **1.0** = directly measured (e.g., logged 2100 calories)
   - **0.7** = strongly implied (e.g., no exercise logged = likely rest days)
   - **0.4** = loosely inferred (e.g., high carb days might indicate stress eating)

## Output Format

${OUTPUT_FORMAT}

## Health & Nutrition Records — ${windowLabel}

${records}`
}

function buildAppleCalendarPrompt(batch: TimeWindowBatch): string {
  const windowLabel = formatWindowLabel(batch, 'week')
  const records = formatRecordsForPrompt(batch)

  return `You are a structured data extractor analyzing Apple Calendar event history for a personal analytics system.

## Context

You are looking at ${batch.records.length} calendar events from **${windowLabel}**.

## Your Job

Read the calendar events below. Identify patterns in scheduling, time allocation, and lifestyle. Individual events mean little — look for what the collection reveals about how this person spends their time, who they spend it with, and what they prioritize.

## What to Extract

- **Time allocation**: how many hours per week in meetings vs. personal vs. health vs. social
- **Scheduling patterns**: morning vs. evening preferences, busy vs. light days, weekend usage
- **Social patterns**: who appears as attendees, recurring people, group vs. solo events
- **Location patterns**: frequent venues, home vs. out, gym visits
- **Category clusters**: work meetings, health appointments, social events, personal projects, fitness
- **Routine signals**: recurring weekly events, consistent time blocks
- **Life stage signals**: what the calendar collectively says about priorities

## Categories

Start with these seed categories, but propose new ones if the data demands it:

${SEED_CATEGORIES}

## Extraction Rules

1. **Produce multiple extractions per window.** A week of calendar data should yield 3–10 extractions.
2. **Data is key-value pairs.** Keys: short, descriptive, lowercase. Values: concrete strings, numbers, or booleans.
3. **source_text should summarize** the events this extraction comes from (e.g., "4 gym sessions at Newport Beach Athletic Club").
4. **Confidence scoring:**
   - **1.0** = directly observed (e.g., 5 work meetings this week)
   - **0.7** = strongly implied (e.g., no evening events suggests early-to-bed routine)
   - **0.4** = loosely inferred (e.g., calendar emptiness might indicate travel or illness)

## Output Format

${OUTPUT_FORMAT}

## Calendar Events — ${windowLabel}

${records}`
}

function buildAppleNotesPrompt(batch: TimeWindowBatch): string {
  const windowLabel = formatWindowLabel(batch, 'month')
  const records = formatRecordsForPrompt(batch)

  return `You are a structured data extractor analyzing Apple Notes for a personal analytics system.

## Context

You are looking at ${batch.records.length} notes created during **${windowLabel}**. These are personal notes — they can contain anything from lists and ideas to reflections and plans.

## Your Job

Read the notes below. Extract meaningful signals about the person's thinking, interests, goals, and state of mind — the same way you would from journal entries. Notes are freeform text, so treat them like journal content.

## What to Extract

- **Topics and interests**: what subjects are they writing about?
- **Goals and plans**: any stated intentions, to-dos, ambitions?
- **Emotional signals**: tone, frustration, excitement, reflection
- **Knowledge areas**: what are they learning or researching?
- **Relationships**: people mentioned, social context
- **Health and lifestyle**: any health, diet, fitness references
- **Creative output**: writing, ideas, projects

## Categories

Start with these seed categories, but propose new ones if the data demands it:

${SEED_CATEGORIES}

## Extraction Rules

1. **One note can produce zero or many extractions.** Don't force extractions where there's nothing meaningful.
2. **Capture implicit data.** A shopping list implies nutrition planning. A workout note implies exercise commitment.
3. **Data is key-value pairs.** Keys: short, descriptive, lowercase. Values: concrete strings, numbers, or booleans.
4. **source_text should quote or summarize** the relevant portion of the note.
5. **Confidence scoring:**
   - **1.0** = explicitly stated
   - **0.7** = strongly implied
   - **0.4** = loosely inferred

## Output Format

${OUTPUT_FORMAT}

## Notes — ${windowLabel}

${records}`
}

const PROMPT_BUILDERS: Record<string, (batch: TimeWindowBatch) => string> = {
  amazon: buildAmazonPrompt,
  youtube: buildYouTubePrompt,
  myfitnesspal: buildMyFitnessPalPrompt,
  apple_calendar: buildAppleCalendarPrompt,
  apple_notes: buildAppleNotesPrompt,
}

export function buildDomainPrompt(batch: TimeWindowBatch): string {
  const builder = PROMPT_BUILDERS[batch.source_domain]
  if (!builder) {
    throw new Error(`No prompt builder for domain: ${batch.source_domain}`)
  }
  return builder(batch)
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
