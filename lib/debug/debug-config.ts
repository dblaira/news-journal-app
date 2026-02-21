// ============================================================
// Debug Kit — Configuration
// ============================================================
// Update PAGE_LABELS and HIDDEN_PATHS for your app's routes.
// Everything else works out of the box.
// ============================================================

// Human-readable labels for each route.
// The overlay and log viewer use these instead of raw paths.
//
// How to fill this in:
//   1. Each folder under app/ with a page.tsx is a route
//   2. Dynamic segments use brackets: app/entries/[id]/page.tsx → '/entries/[id]'
//   3. Give each a short, plain-English label
//
// Quick discovery (run from project root):
//   find app -name "page.tsx" | sed 's|app||;s|/page.tsx||;s|^$|/|'

export const PAGE_LABELS: Record<string, string> = {
  '/': 'Front Page',
  '/stories': 'Stories',
  '/notes': 'Notes',
  '/actions': 'Actions',
  '/connections': 'Connections',
  '/timeline': 'Timeline',
  '/settings': 'Settings',
  '/login': 'Login',
}

// Routes that should NOT appear in the overlay's page selector.
// Prefix match: '/api' hides '/api/anything'.
// Exact match: '/auth/callback' hides only that path.

export const HIDDEN_PATHS: string[] = [
  '/api',
  '/auth',
]

// Set to false to disable all debug logging globally.
// The overlay still mounts but the logger becomes a no-op.
export const DEBUG_ENABLED = process.env.NODE_ENV === 'development'

// Maximum number of log rows kept in the database per user.
// When exceeded, the oldest rows are deleted on the next write.
// Set to 0 to disable automatic cleanup.
export const MAX_LOG_ROWS = 500

// ============================================================
// Feedback Form — Categories, prompts, and placeholders
// ============================================================

export const CATEGORIES = ['bug', 'design', 'feature', 'observation'] as const
export type FeedbackCategory = typeof CATEGORIES[number]

export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'Bug',
  design: 'Design',
  feature: 'Feature',
  observation: 'Observation',
}

export const CATEGORY_DESCRIPTIONS: Record<FeedbackCategory, string> = {
  bug: 'Something isn\'t working right',
  design: 'How it looks or feels',
  feature: 'Something you wish existed',
  observation: 'Anything you noticed, good or bad',
}

export const CATEGORY_PLACEHOLDERS: Record<FeedbackCategory, string> = {
  bug: 'I tapped ___ and expected ___ but instead ___',
  design: 'Something about ___ looks/feels off because ___',
  feature: 'It would help if I could ___',
  observation: 'I noticed that ___',
}

export const CATEGORY_PROMPTS: Record<FeedbackCategory, string[]> = {
  bug: ['Something broke...', 'Wrong info showing...', 'Button doesn\'t work...'],
  design: ['Hard to read...', 'Looks off...', 'Confusing layout...'],
  feature: ['I wish I could...', 'Would be faster if...', 'Missing info about...'],
  observation: ['Feels slow...', 'Works great...', 'Didn\'t expect that...'],
}
