"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import SetTimer from "./SetTimer";
import FormModal from "./FormModal";
import VoiceControl from "./VoiceControl";
import { parseTimeFromDetail, getSmartRestSeconds } from "@/lib/nutrition/parse-time";

/* ───────────────────────── PALETTE ───────────────────────── */
export const C = {
  blue: "#1D5D9B",
  yellow: "#FFE15D",
  red: "#DC3535",
  white: "#FFFFFF",
  black: "#1A1A1A",
  orange: "#F49D1A",
  green: "#1B8C4E",
  teal: "#008080",
} as const;

export const fontFamily = `var(--font-outfit), 'Avenir Next', 'Helvetica Neue', sans-serif`;

/* ───────────────────────── TYPES ───────────────────────── */
export interface Exercise {
  id: string;
  name: string;
  section: string;
  sectionLabel: string;
  sets: number;
  detail: string;
  tip?: string;
  formUrl?: string;
  restSeconds?: number;
}

type CheckState = Record<string, boolean[]>;

interface WorkoutPageProps {
  exercises: Exercise[];
  sections: string[];
  sectionNames: Record<string, string>;
  storageKey: string;
  heights: number[];
  art: React.ComponentType<{ id: string }>;
  title: string;
  subtitle: string;
}

/* ───────────────────────── WEEKLY RESET ───────────────────────── */
function getCurrentWeek(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.ceil((now.getTime() - jan1.getTime()) / 86400000);
  const weekNum = Math.ceil((dayOfYear + jan1.getDay()) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

interface WeekWrapper<T> {
  week: string;
  data: T;
}

function readWeekly<T>(key: string, fallback: T): { data: T; isNewWeek: boolean } {
  if (typeof window === "undefined") return { data: fallback, isNewWeek: false };
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { data: fallback, isNewWeek: false };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "week" in parsed) {
      const wrapper = parsed as WeekWrapper<T>;
      if (wrapper.week === getCurrentWeek()) {
        return { data: wrapper.data, isNewWeek: false };
      }
      return { data: fallback, isNewWeek: true };
    }
    // Legacy data without week wrapper — treat as stale
    return { data: fallback, isNewWeek: true };
  } catch {
    return { data: fallback, isNewWeek: false };
  }
}

function writeWeekly<T>(key: string, data: T) {
  try {
    const wrapper: WeekWrapper<T> = { week: getCurrentWeek(), data };
    localStorage.setItem(key, JSON.stringify(wrapper));
  } catch {}
}

/* ───────────────────────── STORAGE ───────────────────────── */
function saveChecks(key: string, c: CheckState) {
  writeWeekly(key, c);
}

/* ───────────────────────── WEIGHT STORAGE ───────────────────────── */
type WeightState = Record<string, number>;

function weightKey(storageKey: string): string {
  return `${storageKey}-weights`;
}

function loadWeights(storageKey: string): WeightState {
  return readWeekly<WeightState>(weightKey(storageKey), {}).data;
}

function saveWeights(storageKey: string, w: WeightState) {
  writeWeekly(weightKey(storageKey), w);
}

function loadLastWeights(storageKey: string): WeightState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(weightKey(storageKey) + "-last");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function archiveWeightsOnReset(storageKey: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(weightKey(storageKey));
    if (!raw) return;
    const parsed = JSON.parse(raw);
    // Extract weights from either wrapper or legacy format
    const weights = parsed && typeof parsed === "object" && "data" in parsed
      ? parsed.data
      : parsed;
    if (weights && Object.keys(weights).length > 0) {
      localStorage.setItem(weightKey(storageKey) + "-last", JSON.stringify(weights));
    }
  } catch {}
}

/* ───────────────────────── RACE COUNTDOWN ───────────────────────── */
function daysToRace(): number {
  const race = new Date("2026-05-03T00:00:00");
  const now = new Date();
  return Math.max(0, Math.ceil((race.getTime() - now.getTime()) / 86400000));
}

/* ───────────────────────── MAIN COMPONENT ───────────────────────── */
export default function WorkoutPage({
  exercises,
  sections,
  sectionNames,
  storageKey,
  heights,
  art: Art,
  title,
  subtitle,
}: WorkoutPageProps) {
  const [checks, setChecks] = useState<CheckState>({});
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [formModalUrl, setFormModalUrl] = useState<string | null>(null);
  const [weights, setWeights] = useState<WeightState>({});
  const [lastWeights, setLastWeights] = useState<WeightState>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteCopied, setNoteCopied] = useState(false);

  const notesKey = `${storageKey}-notes`;

  useEffect(() => {
    const checksResult = readWeekly<CheckState>(storageKey, {});
    if (checksResult.isNewWeek) {
      archiveWeightsOnReset(storageKey);
      saveChecks(storageKey, {});
      saveWeights(storageKey, {});
      try { localStorage.removeItem(`${storageKey}-notes`); } catch {}
    }
    setChecks(checksResult.data);
    setWeights(loadWeights(storageKey));
    setLastWeights(loadLastWeights(storageKey));
    if (!checksResult.isNewWeek) {
      try {
        const raw = localStorage.getItem(`${storageKey}-notes`);
        if (raw) setNotes(JSON.parse(raw));
      } catch {}
    }
    setMounted(true);
  }, [storageKey]);

  const updateWeight = useCallback(
    (id: string, value: number) => {
      setWeights((prev) => {
        const next = { ...prev, [id]: value };
        saveWeights(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  const updateNote = useCallback(
    (id: string, text: string) => {
      setNotes((prev) => {
        const next = { ...prev, [id]: text };
        try { localStorage.setItem(notesKey, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    [notesKey],
  );

  const toggle = useCallback(
    (id: string, setIdx: number) => {
      setChecks((prev) => {
        const arr = [...(prev[id] || [])];
        arr[setIdx] = !arr[setIdx];
        const next = { ...prev, [id]: arr };
        saveChecks(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  const isSetDone = (id: string, setIdx: number) =>
    !!(checks[id] && checks[id][setIdx]);

  const isExDone = (ex: Exercise) => {
    const arr = checks[ex.id];
    if (!arr) return false;
    for (let i = 0; i < ex.sets; i++) if (!arr[i]) return false;
    return true;
  };

  const isSectionDone = (section: string) =>
    exercises.filter((e) => e.section === section).every(isExDone);

  const totalSets = exercises.reduce((s, e) => s + e.sets, 0);
  const doneSets = exercises.reduce((s, e) => {
    let c = 0;
    for (let i = 0; i < e.sets; i++) if (isSetDone(e.id, i)) c++;
    return s + c;
  }, 0);
  const progress = totalSets > 0 ? doneSets / totalSets : 0;
  const allDone = progress >= 1;
  const totalExercises = exercises.length;
  const doneExercises = exercises.filter(isExDone).length;

  // Archive weights as "last session" when workout completes
  useEffect(() => {
    if (allDone && Object.keys(weights).length > 0) {
      try {
        localStorage.setItem(weightKey(storageKey) + "-last", JSON.stringify(weights));
      } catch {}
    }
  }, [allDone, weights, storageKey]);

  /* ── Masonry layout ── */
  const col1: number[] = [];
  const col2: number[] = [];
  let h1 = 0;
  let h2 = 0;
  exercises.forEach((_, i) => {
    if (h1 <= h2) {
      col1.push(i);
      h1 += heights[i % heights.length] + 12;
    } else {
      col2.push(i);
      h2 += heights[i % heights.length] + 12;
    }
  });

  if (!mounted) {
    return <div style={{ background: C.yellow, minHeight: "100vh" }} />;
  }

  /* ───── FOCUS MODE ───── */
  if (focusIdx !== null) {
    const ex = exercises[focusIdx];
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: C.white,
          zIndex: 100,
          fontFamily,
          overflow: "auto",
        }}
      >
        {/* Art area */}
        <div
          style={{
            position: "relative",
            height: "42vh",
            borderBottom: `4px solid ${C.black}`,
            overflow: "hidden",
          }}
        >
          <Art id={ex.id} />
          {/* Back button */}
          <button
            onClick={() => setFocusIdx(null)}
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: C.white,
              border: `3px solid ${C.black}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 22,
              fontWeight: 800,
              color: C.black,
            }}
            aria-label="Back"
          >
            &#8592;
          </button>
          {/* Section pill + voice control */}
          <div
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <VoiceControl
              callbacks={{
                onDone: () => {
                  // Find first incomplete set and toggle it
                  for (let i = 0; i < ex.sets; i++) {
                    if (!isSetDone(ex.id, i)) {
                      toggle(ex.id, i);
                      break;
                    }
                  }
                },
                onNext: () => {
                  if (focusIdx !== null && focusIdx < exercises.length - 1) {
                    setFocusIdx(focusIdx + 1);
                  }
                },
                onPrev: () => {
                  if (focusIdx !== null && focusIdx > 0) {
                    setFocusIdx(focusIdx - 1);
                  }
                },
                onWeight: (lbs: number) => {
                  updateWeight(ex.id, lbs);
                },
                onNote: (text: string) => {
                  const current = notes[ex.id] || "";
                  updateNote(ex.id, current ? current + "\n" + text : text);
                },
              }}
            />
            <div
              style={{
                background: C.black,
                color: C.yellow,
                padding: "5px 14px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
                fontFamily,
              }}
            >
              {ex.sectionLabel}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "24px 20px 120px" }}>
          {/* Exercise counter */}
          <div style={{
            fontSize: 18,
            fontWeight: 800,
            color: C.black,
            fontFamily,
            opacity: 0.6,
            marginBottom: 6,
          }}>
            Exercise {focusIdx + 1} of {totalExercises} — {totalExercises - focusIdx - 1} to go
          </div>
          <h2
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: C.black,
              margin: 0,
              fontFamily,
              lineHeight: 1.1,
            }}
          >
            {ex.name}
          </h2>
          <p
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: C.black,
              margin: "8px 0 28px",
              fontFamily,
            }}
          >
            {ex.detail}
          </p>

          {/* Set buttons */}
          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 28,
            }}
          >
            {Array.from({ length: ex.sets }).map((_, si) => {
              const done = isSetDone(ex.id, si);
              return (
                <button
                  key={si}
                  onClick={() => toggle(ex.id, si)}
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 16,
                    border: `3px solid ${C.black}`,
                    background: done ? C.red : C.yellow,
                    color: done ? C.white : C.black,
                    fontSize: done ? 38 : 22,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {done ? "\u2713" : `Set ${si + 1}`}
                </button>
              );
            })}
          </div>

          {/* ── Weight Input — hidden for timed/cardio exercises ── */}
          {!parseTimeFromDetail(ex.detail) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
              width: "100%",
            }}
          >
            <button
              onClick={() => {
                const current = weights[ex.id] || lastWeights[ex.id] || 0;
                if (current >= 5) updateWeight(ex.id, current - 5);
              }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                border: `3px solid ${C.black}`,
                background: C.white,
                fontSize: 28,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily,
                color: C.black,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              &minus;
            </button>
            <div
              style={{
                flex: 1,
                height: 56,
                borderRadius: 14,
                border: `3px solid ${C.black}`,
                background: weights[ex.id] ? C.yellow : C.white,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily,
                cursor: "pointer",
                position: "relative",
              }}
              onClick={() => {
                const input = prompt(
                  "Enter weight (lbs):",
                  String(weights[ex.id] || lastWeights[ex.id] || ""),
                );
                if (input !== null && !isNaN(Number(input)) && input.trim() !== "") {
                  updateWeight(ex.id, Number(input));
                }
              }}
            >
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: C.black,
                  lineHeight: 1,
                }}
              >
                {weights[ex.id] || lastWeights[ex.id] || 0} lbs
              </span>
              {!weights[ex.id] && lastWeights[ex.id] && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: C.black,
                    opacity: 0.5,
                  }}
                >
                  Last session
                </span>
              )}
            </div>
            <button
              onClick={() => {
                const current = weights[ex.id] || lastWeights[ex.id] || 0;
                updateWeight(ex.id, current + 5);
              }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                border: `3px solid ${C.black}`,
                background: C.white,
                fontSize: 28,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily,
                color: C.black,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              +
            </button>
          </div>
          )}

          {/* ── Timer — full-screen dual display for timed exercises ── */}
          {(() => {
            const parsedTime = parseTimeFromDetail(ex.detail);
            if (!parsedTime) return null;
            const rest = ex.restSeconds ?? getSmartRestSeconds(ex.section);
            let activeSet = 0;
            for (let i = 0; i < ex.sets; i++) {
              if (!isSetDone(ex.id, i)) { activeSet = i; break; }
              if (i === ex.sets - 1) activeSet = i;
            }
            return (
              <SetTimer
                exerciseSeconds={parsedTime}
                restSeconds={rest}
                currentSet={activeSet}
                totalSets={ex.sets}
                onSetComplete={() => toggle(ex.id, activeSet)}
              />
            );
          })()}

          {/* ── Coaching Cue — gym-readable: high contrast, comically large ── */}
          {ex.tip && (
            <div
              style={{
                background: C.black,
                borderLeft: `6px solid ${C.yellow}`,
                borderRadius: 0,
                padding: "20px 24px",
                fontSize: 32,
                fontWeight: 800,
                lineHeight: 1.35,
                color: C.white,
                fontFamily,
                marginBottom: 24,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {ex.tip}
            </div>
          )}

          {/* ── Form Reference Link (Phase 4) ── */}
          {ex.formUrl && (
            <button
              onClick={() => setFormModalUrl(ex.formUrl!)}
              style={{
                background: C.orange,
                color: C.black,
                border: `3px solid ${C.black}`,
                borderRadius: 12,
                padding: "14px 20px",
                fontSize: 16,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily,
                marginBottom: 20,
                width: "100%",
                textAlign: "center",
              }}
            >
              Watch Form
            </button>
          )}

          {/* Form Modal Overlay */}
          {formModalUrl && (
            <FormModal url={formModalUrl} onClose={() => setFormModalUrl(null)} />
          )}

          {/* ── Exercise Notes — gym-readable ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}>
              <label style={{
                fontSize: 22,
                fontWeight: 800,
                color: C.black,
                fontFamily,
                textTransform: "uppercase",
                letterSpacing: 1.5,
              }}>
                Notes
              </label>
              {notes[ex.id] && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${ex.name}\n${notes[ex.id]}`
                    );
                    setNoteCopied(true);
                    setTimeout(() => setNoteCopied(false), 1500);
                  }}
                  style={{
                    background: noteCopied ? C.green : C.black,
                    color: noteCopied ? C.white : C.yellow,
                    border: `3px solid ${C.black}`,
                    borderRadius: 999,
                    padding: "10px 24px",
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily,
                    transition: "background 0.2s",
                  }}
                >
                  {noteCopied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <textarea
              value={notes[ex.id] || ""}
              onChange={(e) => updateNote(ex.id, e.target.value)}
              placeholder="Adjustments, feedback, form cues..."
              style={{
                width: "100%",
                minHeight: 180,
                borderRadius: 14,
                border: `3px solid ${C.black}`,
                background: C.black,
                padding: "20px 22px",
                fontSize: 24,
                fontWeight: 700,
                fontFamily,
                color: C.white,
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                lineHeight: 1.4,
              }}
              className="notes-textarea"
            />
          </div>

          {/* Nav buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            {focusIdx > 0 && (
              <button
                onClick={() => setFocusIdx(focusIdx - 1)}
                style={{
                  flex: 1,
                  padding: "20px 0",
                  borderRadius: 14,
                  border: `3px solid ${C.black}`,
                  background: C.white,
                  fontSize: 22,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily,
                  color: C.black,
                }}
              >
                &larr; Previous
              </button>
            )}
            {focusIdx < exercises.length - 1 ? (
              <button
                onClick={() => setFocusIdx(focusIdx + 1)}
                style={{
                  flex: 1,
                  padding: "20px 0",
                  borderRadius: 14,
                  border: `3px solid ${C.black}`,
                  background: C.red,
                  fontSize: 22,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily,
                  color: C.white,
                }}
              >
                Next &rarr;
              </button>
            ) : (
              <button
                onClick={() => setFocusIdx(null)}
                style={{
                  flex: 1,
                  padding: "20px 0",
                  borderRadius: 14,
                  border: `3px solid ${C.black}`,
                  background: C.green,
                  fontSize: 22,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily,
                  color: C.white,
                }}
              >
                Done &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ───── BROWSE MODE ───── */
  return (
    <div
      style={{
        background: C.yellow,
        minHeight: "100vh",
        fontFamily,
        paddingBottom: allDone ? 100 : 88,
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: C.yellow,
          borderBottom: `4px solid ${C.black}`,
          padding: "16px 16px 12px",
        }}
      >
        <Link
          href="/workouts"
          style={{
            textDecoration: "none",
            color: C.black,
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 6,
          }}
        >
          &#8592; Workouts
        </Link>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: C.black,
                margin: 0,
                fontFamily,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: C.black,
                margin: "2px 0 0",
                fontFamily,
              }}
            >
              {subtitle}
            </p>
          </div>
          {/* Race countdown pill */}
          <div
            style={{
              background: C.black,
              borderRadius: 999,
              padding: "6px 14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: C.yellow,
                fontFamily,
                lineHeight: 1,
              }}
            >
              {daysToRace()}
            </span>
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: C.white,
                fontFamily,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              DAYS TO RACE
            </span>
          </div>
        </div>

        {/* Section pills */}
        <div
          style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}
        >
          {sections.map((s) => {
            const done = isSectionDone(s);
            const sectionExercises = exercises
              .map((e, i) => ({ e, i }))
              .filter(({ e }) => e.section === s);
            const firstIncomplete = sectionExercises.find(
              ({ e }) => !isExDone(e),
            );
            const target = firstIncomplete
              ? firstIncomplete.i
              : sectionExercises[0]?.i ?? 0;
            return (
              <button
                key={s}
                onClick={() => setFocusIdx(target)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 999,
                  border: `3px solid ${C.black}`,
                  background: done ? C.green : C.white,
                  color: done ? C.white : C.black,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  fontFamily,
                  cursor: "pointer",
                }}
              >
                {sectionNames[s]}
              </button>
            );
          })}
        </div>

        {/* Exercise counter + Progress bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 10,
          marginBottom: 4,
        }}>
          <span style={{
            fontSize: 14,
            fontWeight: 800,
            color: C.black,
            fontFamily,
          }}>
            {doneExercises} of {totalExercises} exercises done
          </span>
          <span style={{
            fontSize: 14,
            fontWeight: 800,
            color: C.black,
            fontFamily,
          }}>
            {totalExercises - doneExercises} to go
          </span>
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 4,
            border: `3px solid ${C.black}`,
            background: C.white,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background: allDone ? C.green : C.red,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </header>

      {/* EXPORT NOTES — only show when notes exist */}
      {Object.values(notes).some((n) => n.trim()) && (
        <div style={{ padding: "10px 16px 0" }}>
          <button
            onClick={() => {
              const lines = exercises
                .filter((ex) => notes[ex.id]?.trim())
                .map((ex) => `## ${ex.name}\n${notes[ex.id]}`)
                .join("\n\n");
              const header = `# ${title} — Training Notes\n${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}\n\n`;
              navigator.clipboard.writeText(header + lines);
              alert("All notes copied to clipboard!");
            }}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 12,
              border: `3px solid ${C.black}`,
              background: C.blue,
              color: C.white,
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Export All Notes to Clipboard
          </button>
        </div>
      )}

      {/* MASONRY GRID */}
      <div style={{ display: "flex", gap: 12, padding: "12px 12px 0" }}>
        {[col1, col2].map((col, ci) => (
          <div
            key={ci}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {col.map((idx) => {
              const ex = exercises[idx];
              const h = heights[idx % heights.length];
              const done = isExDone(ex);
              return (
                <button
                  key={ex.id}
                  onClick={() => setFocusIdx(idx)}
                  style={{
                    position: "relative",
                    height: h,
                    border: `3px solid ${C.black}`,
                    borderRadius: 14,
                    overflow: "hidden",
                    cursor: "pointer",
                    filter: done ? "saturate(0.3)" : "none",
                    display: "block",
                    width: "100%",
                    padding: 0,
                    background: C.black,
                    textAlign: "left" as const,
                  }}
                >
                  {/* SVG art */}
                  <div style={{ position: "absolute", inset: 0 }}>
                    <Art id={ex.id} />
                  </div>
                  {/* Bottom bar */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: C.black,
                      padding: "8px 10px 10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: C.yellow,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        fontFamily,
                      }}
                    >
                      {ex.sectionLabel}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: C.white,
                        fontFamily,
                        lineHeight: 1.15,
                        margin: "2px 0 4px",
                      }}
                    >
                      {ex.name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: C.white,
                          fontFamily,
                          fontWeight: 600,
                        }}
                      >
                        {ex.detail}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          gap: 4,
                          marginLeft: "auto",
                        }}
                      >
                        {Array.from({ length: ex.sets }).map((_, si) => (
                          <div
                            key={si}
                            style={{
                              width: 10,
                              height: 10,
                              border: `2px solid ${C.black}`,
                              background: isSetDone(ex.id, si)
                                ? C.yellow
                                : C.white,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* COMPLETION BANNER */}
      {allDone && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: C.green,
            borderTop: `4px solid ${C.black}`,
            padding: "14px 20px",
            textAlign: "center",
            fontSize: 18,
            fontWeight: 800,
            color: C.white,
            fontFamily,
            zIndex: 50,
          }}
        >
          WORKOUT COMPLETE — YOU CRUSHED IT
        </div>
      )}
    </div>
  );
}
