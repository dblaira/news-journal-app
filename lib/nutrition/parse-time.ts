/**
 * Parse a time duration from an exercise detail string.
 * Returns seconds, or null if no time found.
 *
 * Handles:
 *   "15 sec hold"       → 15
 *   "20 sec each"       → 20
 *   "45s each"          → 45
 *   "30–45 sec"         → 45 (upper bound)
 *   "30–45s hold"       → 45
 *   "2 × 10 sec"        → 10
 *   "10 sec each side"  → 10
 *   "10 sec each foot"  → 10
 *   "Zone 2 · 30–40 min"→ 2400
 *   "3–5 min"           → 300
 *   "60 min · Zone 2"   → 3600
 *   "Max time"          → null
 *   "12 reps"           → null
 *   "10 per side"       → null
 */
export function parseTimeFromDetail(detail: string): number | null {
  if (!detail) return null;

  const d = detail.toLowerCase();

  // Skip non-time prescriptions
  if (/^\d+\s*reps?$/i.test(d.trim())) return null;
  if (/^\d+\s*(per|each)\s/i.test(d.trim()) && !/(sec|min|s\b)/i.test(d)) return null;
  if (/max\s*time/i.test(d)) return null;
  if (/max\s*reps/i.test(d)) return null;

  // Match minute patterns first: "30–40 min", "60 min", "3–5 min"
  const minRange = d.match(/(\d+)\s*[–\-—]\s*(\d+)\s*min/);
  if (minRange) {
    return parseInt(minRange[2], 10) * 60;
  }
  const minSingle = d.match(/(\d+)\s*min/);
  if (minSingle) {
    return parseInt(minSingle[1], 10) * 60;
  }

  // Match second patterns: "30–45 sec", "30–45s", "15 sec", "45s"
  const secRange = d.match(/(\d+)\s*[–\-—]\s*(\d+)\s*(?:sec|s\b)/);
  if (secRange) {
    return parseInt(secRange[2], 10);
  }

  // "2 × 10 sec" pattern
  const multiSec = d.match(/\d+\s*[×x]\s*(\d+)\s*(?:sec|s\b)/);
  if (multiSec) {
    return parseInt(multiSec[1], 10);
  }

  const secSingle = d.match(/(\d+)\s*(?:sec|s\b)/);
  if (secSingle) {
    return parseInt(secSingle[1], 10);
  }

  return null;
}

/**
 * Get smart rest period based on exercise section.
 * - Activation / Drills / Pre-run / Warm-Up: 60s
 * - Main strength / Main lifts: 90s
 * - Heavy compounds / Complex: 120s
 * - Recovery / Finishers / Accessories: 60s
 */
export function getSmartRestSeconds(section: string): number {
  const s = section.toLowerCase();
  if (
    s.includes("complex") ||
    s === "main-1" ||
    s === "main-2"
  ) {
    return 120;
  }
  if (s === "main" || s.includes("strength") || s.includes("upper")) {
    return 90;
  }
  // Activation, drills, warm-up, pre-run, recovery, finishers, accessories, correctives
  return 60;
}
