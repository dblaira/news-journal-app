'use client'

import { useState } from 'react'

const RED = '#DC143C'
const BODONI = "var(--font-bodoni-moda), Georgia, 'Times New Roman', serif"
const SAND = '#E0D6C8' // warmer, more visible sand — clearer contrast vs white

// Mobile-first styles for gym use on phone
const MOBILE_STYLES = `
  .workout-mobile .exercise-checkboxes input[type="checkbox"] {
    appearance: none; -webkit-appearance: none;
    width: 48px; height: 28px; min-width: 48px; min-height: 28px;
    border-radius: 14px;
    border: 2px solid #D1D5DB;
    background: #FFFFFF;
    cursor: pointer;
  }
  .workout-mobile .exercise-checkboxes input[type="checkbox"]:checked {
    background: #DC143C;
    border-color: #DC143C;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12l5 5L20 7'/%3E%3C/svg%3E");
    background-size: 20px;
    background-position: center;
    background-repeat: no-repeat;
  }
  .workout-mobile .exercise-row--dark .exercise-checkboxes input[type="checkbox"] {
    border-color: rgba(255,255,255,0.3);
    background: rgba(255,255,255,0.06);
  }
  @media (max-width: 640px) {
    .workout-mobile .workout-root { padding: 0.75rem; max-width: 100%; }
    .workout-mobile .workout-header { padding: 1.25rem 1rem; }
    .workout-mobile .workout-title { font-size: 1.6rem; }
    .workout-mobile .workout-subtitle { font-size: 0.95rem; }
    .workout-mobile .workout-format { display: none; }
    .workout-mobile .day-header { padding: 1rem; flex-direction: column; align-items: flex-start; gap: 0.5rem; }
    .workout-mobile .day-header h2 { font-size: 1.25rem; }
    .workout-mobile .day-workout-type { font-size: 0.85rem; margin-right: 0; }
    .workout-mobile .day-content { padding: 1rem; }
    .workout-mobile .exercise-row { flex-direction: column; align-items: flex-start; text-align: left; gap: 0.75rem; padding: 1rem; min-height: auto; }
    .workout-mobile .exercise-image { display: none; }
    .workout-mobile .exercise-name { font-size: 1.05rem; line-height: 1.35; }
    .workout-mobile .exercise-reps { justify-content: flex-start; }
    .workout-mobile .exercise-checkboxes { justify-content: flex-start; }
    .workout-mobile .exercise-reps { font-size: 1rem; }
    .workout-mobile .exercise-notes { font-size: 0.9rem; line-height: 1.45; }
    .workout-mobile .exercise-checkboxes { flex-wrap: wrap; gap: 1.25rem; }
    .workout-mobile .exercise-checkboxes label { min-width: 0; padding: 0.5rem 0; }
    .workout-mobile .exercise-checkboxes input { width: 64px; height: 36px; min-width: 64px; min-height: 36px; border-radius: 18px; }
    .workout-mobile .exercise-checkboxes input:checked { background-size: 26px; }
    .workout-mobile .exercise-checkboxes span { font-size: 0.95rem; }
    .workout-mobile .section-header { font-size: 0.95rem; padding: 0.75rem 0; margin-bottom: 0.75rem; }
    .workout-mobile .section-toggle { padding: 0.75rem 0; min-height: 44px; font-size: 0.95rem; }
    .workout-mobile .day-notes { padding: 1rem; }
    .workout-mobile .day-notes-label { font-size: 0.8rem; }
    .workout-mobile .day-notes-editable { font-size: 1rem; min-height: 44px; }
    .workout-mobile .exercise-metadata { padding-left: 1rem !important; }
    .workout-mobile .workout-footer { font-size: 0.75rem; margin-top: 1.5rem; padding: 0 0.5rem; }
  }
`

interface ExerciseLog {
  weight?: string
  effortLevel?: string
  notes?: string
}

interface Exercise {
  id: string
  name: string
  imageUrl?: string
  setsCompleted: boolean[]
  reps?: string
  notes?: string
  log?: ExerciseLog
}

/** Parse reps string to determine number of sets (e.g. "4 × 12" → 4, "1 set × 10" → 1) */
function getSetCount(reps: string | undefined): number {
  if (!reps || !reps.trim()) return 1
  const m = reps.match(/^(\d+)\s*(?:sets?|[×x])\s*\d*/i) || reps.match(/^(\d+)\s*[×x]/i) || reps.match(/(\d+)\s*sets?\s*[×x]/i)
  if (m) return Math.min(Math.max(1, parseInt(m[1], 10)), 12)
  return 1
}

interface Section {
  title: string
  exercises: Exercise[]
  collapsible?: boolean
}

interface WorkoutDay {
  id: string
  day: string
  workoutType: string
  sections: Section[]
  pending?: boolean
}

const INITIAL_WEEK: WorkoutDay[] = [
  {
    id: 'sun',
    day: 'Sunday',
    workoutType: '10mi Zone 2 Run + Pre-Run Activation + Post-Run Recovery',
    sections: [
      {
        title: 'Pre-Run Activation',
        exercises: [
          { id: 'sun-1', name: 'Knee to wall dorsiflexion rocks', reps: '1 set × 10 per side', setsCompleted: [false, false, false], notes: '' },
          { id: 'sun-2', name: 'Ankle circles', reps: '10 each direction per side', setsCompleted: [false, false, false], notes: '' },
          { id: 'sun-3', name: 'Eversion isometric hold', reps: '2 sets × 15 seconds', setsCompleted: [false, false, false], notes: '' },
          { id: 'sun-4', name: 'Short foot holds', reps: '2 sets × 10 sec each side', setsCompleted: [false, false, false], notes: 'Press big toe, little toe, and heel into the ground, then lightly lift your arch by pulling the ball of your foot toward your heel without curling your toes.' },
          { id: 'sun-5', name: 'Standing hip flexor march hold', reps: '2 sets × 10 seconds', setsCompleted: [false, false, false], notes: '' },
          { id: 'sun-6', name: 'Side lying adduction raises', reps: '1 set × 8 each side', setsCompleted: [false, false, false], notes: '' },
          { id: 'sun-7', name: 'Single leg balance', reps: '2 sets × 20 sec each side', setsCompleted: [false, false, false], notes: '' },
          { id: 'sun-8', name: 'Single leg RDL reach (bodyweight)', reps: '1 set × 5 each side, slow', setsCompleted: [false, false, false], notes: '' },
        ],
      },
      {
        title: 'Run',
        exercises: [
          { id: 'sun-9', name: '10 mile run', reps: 'First mile Zone 1, then Zone 2 for remaining 9 miles', setsCompleted: [false, false, false], notes: '' },
        ],
      },
      {
        title: 'Post-Run Recovery',
        exercises: [
          { id: 'sun-10', name: 'Walk', reps: '3–5 minutes', setsCompleted: [false, false, false], notes: '' },
          { id: 'sun-11', name: 'Foam roll', reps: 'Quads, Calves, Glutes, IT Band', setsCompleted: [false, false, false], notes: '' },
          { id: 'sun-12', name: 'Static stretch', reps: 'Hip flexor, Calf, Adductor', setsCompleted: [false, false, false], notes: '' },
        ],
      },
    ],
  },
  {
    id: 'mon',
    day: 'Monday',
    workoutType: 'Zone 2 Bike 60mi + Upper Strength A (Pull/Push)',
    sections: [
      { title: 'Cardio', exercises: [{ id: 'mon-1', name: 'Zone 2 bike', reps: '60 miles', setsCompleted: [false, false, false], notes: '' }] },
      {
        title: 'Complex 1 — Pull then Push',
        exercises: [
          { id: 'mon-2', name: 'Rows (your choice)', reps: '4 × 12', setsCompleted: [false, false, false], notes: '' },
          { id: 'mon-3', name: 'Bench press (bar or dumbbells)', reps: '4 × 12', setsCompleted: [false, false, false], notes: '' },
          { id: 'mon-4', name: 'Crunches', reps: '4 × 20', setsCompleted: [false, false, false], notes: '' },
          { id: 'mon-5', name: 'Rest', reps: '4 × 30 sec between rounds', setsCompleted: [false, false, false], notes: '' },
        ],
      },
      {
        title: 'Complex 2',
        exercises: [
          { id: 'mon-6', name: 'Pull downs', reps: '4 × 10', setsCompleted: [false, false, false], notes: '' },
          { id: 'mon-7', name: 'Shoulder presses', reps: '4 × 10', setsCompleted: [false, false, false], notes: '' },
          { id: 'mon-8', name: 'Plank squeeze', reps: '4 × 10 seconds', setsCompleted: [false, false, false], notes: '' },
          { id: 'mon-9', name: 'Rest', reps: '4 × 30 sec between rounds', setsCompleted: [false, false, false], notes: '' },
        ],
      },
      {
        title: 'Finisher',
        exercises: [
          { id: 'mon-10', name: 'Dead hang', reps: 'Max time', setsCompleted: [false, false, false], notes: '' },
          { id: 'mon-11', name: 'Chest stretch', reps: '', setsCompleted: [false, false, false], notes: '' },
          { id: 'mon-12', name: 'Leg foam roll', reps: '3 minutes', setsCompleted: [false, false, false], notes: '' },
        ],
      },
    ],
  },
  {
    id: 'tue',
    day: 'Tuesday',
    workoutType: 'Lower Strength A — Main Lower Day + Ankle/Hip Correctives',
    sections: [
      {
        title: 'Warm-Up (no breaks)',
        exercises: [
          { id: 'tue-1', name: 'Band hip flexion march', reps: '2 × 8 each side', setsCompleted: [false, false, false], notes: '' },
          { id: 'tue-2', name: 'Short foot', reps: '2 × 10 sec each foot', setsCompleted: [false, false, false], notes: '' },
          { id: 'tue-3', name: 'Band ankle eversion', reps: '2 × 15 each side', setsCompleted: [false, false, false], notes: '' },
          { id: 'tue-4', name: 'Adductor squeeze (pillow or ball)', reps: '2 × 20 sec', setsCompleted: [false, false, false], notes: '' },
        ],
      },
      {
        title: 'Main Strength — Block 1 (30 sec rest between rounds)',
        exercises: [
          { id: 'tue-5', name: 'Split squat (controlled)', reps: '3 × 10 each leg', setsCompleted: [false, false, false], notes: '' },
          { id: 'tue-6', name: 'RDL (dumbbells or barbell)', reps: '3 × 10', setsCompleted: [false, false, false], notes: '' },
          { id: 'tue-7', name: 'Cable transverse rotation', reps: '3 × 12 each side', setsCompleted: [false, false, false], notes: '' },
        ],
      },
      {
        title: 'Main Strength — Block 2 (30 sec rest between rounds)',
        exercises: [
          { id: 'tue-8', name: 'Sumo kettlebell squat', reps: '3 × 12', setsCompleted: [false, false, false], notes: 'Toes pointed out as far as hips allow, knees track over toes. Go light and slow — should feel like a nice adductor stretch, not pain. Protect the groin.' },
          { id: 'tue-9', name: 'Lateral band abduction steps', reps: '3 × 12 each side', setsCompleted: [false, false, false], notes: '' },
          { id: 'tue-10', name: 'Hanging knees to chest', reps: '3 × 8', setsCompleted: [false, false, false], notes: '' },
        ],
      },
      {
        title: 'Accessories & Correctives',
        exercises: [
          { id: 'tue-11', name: 'Calf raises (slow)', reps: '3 × 15', setsCompleted: [false, false, false], notes: '' },
          { id: 'tue-12', name: 'Band ankle eversion', reps: '3 × 20 each side', setsCompleted: [false, false, false], notes: '' },
          { id: 'tue-13', name: 'Band hip flexion march', reps: '3 × 12 each side', setsCompleted: [false, false, false], notes: '' },
          { id: 'tue-14', name: 'Adductor squeeze', reps: '2 × 20 sec', setsCompleted: [false, false, false], notes: '' },
        ],
      },
    ],
  },
  {
    id: 'wed',
    day: 'Wednesday',
    workoutType: 'Zone 2 Cardio (Bike 60min or Run 40min) + Upper Strength B (Push/Pull)',
    sections: [
      {
        title: 'Cardio — Choose One',
        exercises: [
          { id: 'wed-1', name: 'Option A: Zone 2 bike', reps: '60 minutes', setsCompleted: [false, false, false], notes: '' },
          { id: 'wed-2', name: 'Option B: Zone 2 run', reps: '40 minutes (do pre-run warmup below if running)', setsCompleted: [false, false, false], notes: '' },
        ],
      },
      {
        title: 'Pre-Run Warmup (only if running)',
        collapsible: true,
        exercises: [
          { id: 'wed-3', name: 'Knee to wall dorsiflexion rocks', reps: '1 set × 10 per side', setsCompleted: [false, false, false], notes: '' },
          { id: 'wed-4', name: 'Ankle circles', reps: '10 each direction per side', setsCompleted: [false, false, false], notes: '' },
          { id: 'wed-5', name: 'Eversion isometric hold', reps: '2 sets × 15 seconds', setsCompleted: [false, false, false], notes: '' },
          { id: 'wed-6', name: 'Short foot holds', reps: '2 sets × 10 sec each side', setsCompleted: [false, false, false], notes: 'Press big toe, little toe, and heel into the ground, then lightly lift your arch by pulling the ball of your foot toward your heel without curling your toes.' },
          { id: 'wed-7', name: 'Standing hip flexor march hold', reps: '2 sets × 10 seconds', setsCompleted: [false, false, false], notes: '' },
          { id: 'wed-8', name: 'Side lying adduction raises', reps: '1 set × 8 each side', setsCompleted: [false, false, false], notes: '' },
          { id: 'wed-9', name: 'Single leg balance', reps: '2 sets × 20 sec each side', setsCompleted: [false, false, false], notes: '' },
          { id: 'wed-10', name: 'Single leg RDL reach (bodyweight)', reps: '1 set × 5 each side, slow', setsCompleted: [false, false, false], notes: '' },
        ],
      },
      {
        title: 'Upper B — Block 1 (15 sec rest between rounds)',
        exercises: [
          { id: 'wed-11', name: 'Cable tricep extension', reps: '3 × 12', setsCompleted: [false, false, false], notes: '' },
          { id: 'wed-12', name: 'Dumbbell bicep curls', reps: '3 × 12', setsCompleted: [false, false, false], notes: '' },
          { id: 'wed-13', name: 'Floor reverse crunches', reps: '3 × 10', setsCompleted: [false, false, false], notes: '' },
        ],
      },
      {
        title: 'Upper B — Block 2 (15 sec rest between rounds)',
        exercises: [
          { id: 'wed-14', name: 'Cable unilateral chest press (staggered stance)', reps: '3 × 12 each side', setsCompleted: [false, false, false], notes: '' },
          { id: 'wed-15', name: 'Cable unilateral row (staggered stance)', reps: '3 × 12 each side', setsCompleted: [false, false, false], notes: '' },
        ],
      },
      {
        title: 'Finisher (1 min rest after)',
        exercises: [
          { id: 'wed-16', name: 'Crunches', reps: '40 reps', setsCompleted: [false, false, false], notes: '' },
          { id: 'wed-17', name: 'Pull-ups (band assist if <5)', reps: '2 × max', setsCompleted: [false, false, false], notes: '' },
          { id: 'wed-18', name: 'Push-ups', reps: '2 × max', setsCompleted: [false, false, false], notes: '' },
        ],
      },
    ],
  },
  {
    id: 'thu',
    day: 'Thursday',
    workoutType: 'Run Skill Day — Zone 2 with Cadence Focus & Technique Drills',
    pending: true,
    sections: [
      {
        title: 'Details Coming',
        exercises: [
          { id: 'thu-1', name: 'Awaiting detailed workout from Giacomo', reps: 'Zone 2 run with cadence focus and technique drills, post-run recovery', setsCompleted: [false, false, false], notes: '' },
        ],
      },
    ],
  },
  {
    id: 'fri',
    day: 'Friday',
    workoutType: 'Lower Strength B — Lighter Day, Stability & Tissue Capacity',
    pending: true,
    sections: [
      {
        title: 'Details Coming',
        exercises: [
          { id: 'fri-1', name: 'Awaiting detailed workout from Giacomo', reps: 'Lighter lower day focused on stability and tissue capacity plus ankle and hip corrective accessories', setsCompleted: [false, false, false], notes: '' },
        ],
      },
    ],
  },
  {
    id: 'sat',
    day: 'Saturday',
    workoutType: 'Full Off Day — Optional Easy Walk & Light Mobility',
    sections: [
      {
        title: 'Recovery',
        exercises: [
          { id: 'sat-1', name: 'Optional easy walk', reps: '', setsCompleted: [false, false, false], notes: '' },
          { id: 'sat-2', name: 'Light mobility', reps: 'Optional', setsCompleted: [false, false, false], notes: '' },
        ],
      },
    ],
  },
]

function ExerciseRow({
  exercise,
  onSetToggle,
  onLogUpdate,
  isExpanded,
  onToggleExpand,
  variant = 'light',
}: {
  exercise: Exercise
  onSetToggle: (exerciseId: string, setIndex: number) => void
  onLogUpdate: (exerciseId: string, log: Partial<ExerciseLog>) => void
  isExpanded: boolean
  onToggleExpand: () => void
  variant?: 'light' | 'dark'
}) {
  const isDark = variant === 'dark'
  const log = exercise.log || {}

  return (
    <div
      className={`exercise-row ${isDark ? 'exercise-row--dark' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        background: isDark ? '#0A0A0A' : '#FFFFFF',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E8E5DF',
        borderTop: isDark ? `8px solid ${RED}` : undefined,
        borderRadius: 0,
        marginBottom: '0.5rem',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem' }}>
        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          style={{
            flexShrink: 0,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: isDark ? 'rgba(255,255,255,0.7)' : '#6B7280',
          }}
        >
          <span style={{ transform: isExpanded ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s', fontSize: '1rem' }}>▸</span>
        </button>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
          <div
            className="exercise-image"
            style={{
              flexShrink: 0,
              width: 72,
              height: 72,
              background: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E2DD',
              borderRadius: 0,
              overflow: 'hidden',
              marginBottom: '0.5rem',
            }}
          >
            {exercise.imageUrl ? (
              <img src={exercise.imageUrl} alt={exercise.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? 'rgba(255,255,255,0.4)' : '#9A9590', fontSize: '0.7rem' }}>
                Image
              </div>
            )}
          </div>
          <div className="exercise-name" style={{ fontFamily: BODONI, fontSize: '1rem', fontWeight: 600, color: isDark ? '#FFFFFF' : '#1F2937', marginBottom: '0.15rem', textTransform: 'uppercase' }}>
            {exercise.name}
          </div>
          {exercise.reps && (
            <div className="exercise-reps" style={{ fontSize: '0.85rem', color: isDark ? 'rgba(255,255,255,0.7)' : '#6B7280' }}>
              {exercise.reps.split(/(\d+)/).map((part, i) => /^\d+$/.test(part) ? <strong key={i} style={{ fontWeight: 700 }}>{part}</strong> : part)}
            </div>
          )}
          {exercise.notes && <div className="exercise-notes" style={{ fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.5)' : '#9A9590', fontStyle: 'italic', marginTop: '0.35rem', lineHeight: 1.4 }}>{exercise.notes}</div>}
          <div className="exercise-checkboxes" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '1.25rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {exercise.setsCompleted.map((completed, setIndex) => (
              <label key={setIndex} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={() => onSetToggle(exercise.id, setIndex)}
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div
          className="exercise-metadata"
          style={{
            padding: '1rem 1rem 1rem 3.5rem',
            borderTop: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #E8E5DF',
            background: isDark ? 'rgba(0,0,0,0.3)' : '#FAFAF9',
          }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 320 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.7)' : '#6B7280' }}>
                <span style={{ minWidth: 90 }}>Weight (lbs)</span>
                <input
                  type="number"
                  placeholder="—"
                  value={log.weight ?? ''}
                  onChange={(e) => onLogUpdate(exercise.id, { ...log, weight: e.target.value })}
                  style={{
                    width: 70,
                    padding: '0.35rem 0.5rem',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : '#E8E5DF'}`,
                    borderRadius: 0,
                    background: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                    color: isDark ? '#FFFFFF' : '#1F2937',
                    fontSize: '0.85rem',
                  }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.7)' : '#6B7280' }}>
                <span style={{ minWidth: 90 }}>Effort (1–10)</span>
                <input
                  type="text"
                  placeholder="—"
                  value={log.effortLevel ?? ''}
                  onChange={(e) => onLogUpdate(exercise.id, { ...log, effortLevel: e.target.value })}
                  style={{
                    width: 50,
                    padding: '0.35rem 0.5rem',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : '#E8E5DF'}`,
                    borderRadius: 0,
                    background: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                    color: isDark ? '#FFFFFF' : '#1F2937',
                    fontSize: '0.85rem',
                  }}
                />
              </label>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.7)' : '#6B7280', textAlign: 'left' }}>
              Notes (e.g. fewer reps, RPE, etc.)
              <textarea
                placeholder="Add notes…"
                value={log.notes ?? ''}
                onChange={(e) => onLogUpdate(exercise.id, { ...log, notes: e.target.value })}
                rows={2}
                style={{
                  padding: '0.5rem',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : '#E8E5DF'}`,
                  borderRadius: 0,
                  background: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                  color: isDark ? '#FFFFFF' : '#1F2937',
                  fontSize: '0.85rem',
                  resize: 'vertical',
                  minHeight: 56,
                }}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

export function WorkoutProgram() {
  const [week, setWeek] = useState<WorkoutDay[]>(() =>
    INITIAL_WEEK.map((day) => ({
      ...day,
      sections: day.sections.map((sec) => ({
        ...sec,
        exercises: sec.exercises.map((ex) => ({
          ...ex,
          setsCompleted: Array(getSetCount(ex.reps)).fill(false),
        })),
      })),
    }))
  )

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    INITIAL_WEEK.forEach((day) => {
      day.sections.forEach((sec, si) => {
        if (sec.collapsible) init[`${day.id}-${si}`] = true
      })
    })
    return init
  })

  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({})

  const handleSetToggle = (exerciseId: string, setIndex: number, dayId: string) => {
    setWeek((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day
        return {
          ...day,
          sections: day.sections.map((sec) => ({
            ...sec,
            exercises: sec.exercises.map((ex) => {
              if (ex.id !== exerciseId) return ex
              const next = [...ex.setsCompleted]
              next[setIndex] = !next[setIndex]
              return { ...ex, setsCompleted: next }
            }),
          })),
        }
      })
    )
  }

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleExerciseExpand = (exerciseId: string) => {
    setExpandedExercises((prev) => ({ ...prev, [exerciseId]: !prev[exerciseId] }))
  }

  const handleLogUpdate = (exerciseId: string, dayId: string, log: Partial<ExerciseLog>) => {
    setWeek((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day
        return {
          ...day,
          sections: day.sections.map((sec) => ({
            ...sec,
            exercises: sec.exercises.map((ex) => {
              if (ex.id !== exerciseId) return ex
              return { ...ex, log: { ...(ex.log || {}), ...log } }
            }),
          })),
        }
      })
    )
  }

  return (
    <div className="workout-mobile">
      <style dangerouslySetInnerHTML={{ __html: MOBILE_STYLES }} />
      <header className="workout-header" style={{ background: '#111111', padding: '2rem 1.5rem 1.5rem', textAlign: 'left', borderBottom: `2px solid ${RED}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 className="workout-title" style={{ fontFamily: BODONI, fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 400, color: '#FFFFFF', margin: '0 0 0.25rem' }}>
            Workout Program
          </h1>
          <p className="workout-subtitle" style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', margin: 0, fontStyle: 'italic' }}>
            Programmed by Giacomo
          </p>
        </div>
      </header>
      <div className="workout-root" style={{ padding: '2rem', maxWidth: 900, margin: '0 auto', background: '#F0EEEA' }}>
        <div className="workout-format" style={{ padding: '1rem', background: '#F5F2ED', borderLeft: `4px solid ${RED}`, marginBottom: '2rem', fontSize: '0.9rem', color: '#5A5650', textAlign: 'left' }}>
          <strong style={{ color: '#1F2937' }}>Data from trainer.</strong> Each day has sections (e.g. Pre-Run Activation, Cardio, Main Strength). Exercises show name, reps/detail, optional form notes, and 3 checkboxes per set. Collapsible sections (e.g. Pre-Run Warmup) start collapsed.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {week.map((day, dayIndex) => {
            let exerciseIndexInDay = 0
            const isSandDay = dayIndex % 2 === 0 // alternate: Sun/Tue/Thu/Sat = sand
            return (
            <article key={day.id} style={{ border: `2px solid ${isSandDay ? '#D4C9B8' : '#E8E5DF'}`, borderLeft: `6px solid ${isSandDay ? RED : '#111'}`, borderRadius: 0, overflow: 'hidden', background: isSandDay ? SAND : '#FFFFFF' }}>
              <div className="day-header" style={{ padding: '1rem 1.25rem', background: '#111', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '0.5rem' }}>
                <h2 style={{ fontFamily: BODONI, fontSize: '1.35rem', fontWeight: 400, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {day.day}
                  {day.pending && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#F5A623', background: 'rgba(245,166,35,0.2)', padding: '0.15rem 0.5rem', borderRadius: 0, textTransform: 'uppercase', letterSpacing: '0.05rem' }}>
                      Pending
                    </span>
                  )}
                </h2>
                <div>
                  <span className="day-workout-type" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1rem', color: '#B8956B', marginRight: '0.75rem' }}>
                    {day.workoutType}
                  </span>
                </div>
              </div>
              <div className="day-content" style={{ padding: '1.25rem' }}>
                {day.sections.map((section, si) => {
                  const sectionKey = `${day.id}-${si}`
                  const isCollapsed = collapsedSections[sectionKey]
                  const isCollapsible = section.collapsible === true
                  return (
                    <div key={sectionKey} style={{ marginBottom: si < day.sections.length - 1 ? '1.5rem' : 0 }}>
                      {isCollapsible ? (
                        <button
                          type="button"
                          className="section-toggle"
                          onClick={() => toggleSection(sectionKey)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0.5rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, width: '100%', fontFamily: BODONI, fontSize: '0.85rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08rem', textAlign: 'left' }}
                        >
                          <span style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▸</span>
                          {section.title}
                        </button>
                      ) : (
                        <div className="section-header" style={{ fontFamily: BODONI, fontSize: '0.85rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08rem', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #E8E5DF', textAlign: 'left' }}>
                          {section.title}
                        </div>
                      )}
                      {(!isCollapsible || !isCollapsed) && (
                        <>
                          {section.exercises.map((exercise) => {
                            const idx = exerciseIndexInDay++
                            const isDark = idx % 2 === 1
                            return (
                              <ExerciseRow
                                key={exercise.id}
                                exercise={exercise}
                                onSetToggle={(exId, setIdx) => handleSetToggle(exId, setIdx, day.id)}
                                onLogUpdate={(exId, log) => handleLogUpdate(exId, day.id, log)}
                                isExpanded={!!expandedExercises[exercise.id]}
                                onToggleExpand={() => toggleExerciseExpand(exercise.id)}
                                variant={isDark ? 'dark' : 'light'}
                              />
                            )
                          })}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="day-notes" style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #E8E5DF', background: '#FAFAF9', textAlign: 'left' }}>
                <div className="day-notes-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08rem', color: '#9A9590', marginBottom: '0.35rem' }}>
                  Workout notes
                </div>
                <div className="day-notes-editable" contentEditable suppressContentEditableWarning style={{ fontSize: '0.9rem', color: '#5A5650', minHeight: 36, outline: 'none', textAlign: 'left' }}>
                  Add notes for this workout…
                </div>
              </div>
            </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
