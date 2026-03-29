"use client";

import { useState } from "react";
import Link from "next/link";

/* ───────────────────────── PALETTE ───────────────────────── */
const C = {
  blue: "#1D5D9B",
  yellow: "#FFE15D",
  red: "#DC3535",
  white: "#FFFFFF",
  black: "#1A1A1A",
  orange: "#F49D1A",
  green: "#1B8C4E",
  teal: "#008080",
} as const;

const fontFamily = `var(--font-outfit), 'Avenir Next', 'Helvetica Neue', sans-serif`;

/* ───────────────────────── RACE COUNTDOWN ───────────────────────── */
function daysToRace(): number {
  const race = new Date("2026-05-03T00:00:00");
  const now = new Date();
  return Math.max(0, Math.ceil((race.getTime() - now.getTime()) / 86400000));
}

/* ───────────────────────── REST DAY SCIENCE NOTES ───────────────────────── */
interface NoteSection {
  id: string;
  title: string;
  color: string;
  textColor: string;
  bullets: string[];
}

const REST_DAY_NOTES: NoteSection[] = [
  {
    id: "direct-answer",
    title: "Direct Answer",
    color: C.black,
    textColor: C.yellow,
    bullets: [
      "No, a high-end athlete over 40 does not universally \"must\" take 1 full day off from all exercise (including Zone 2) every week.",
      "What IS evidence-based: endurance adaptation requires recovery. Inadequate recovery relative to load increases risk of non-functional overreaching, overtraining syndrome, illness, and overuse injury.",
      "Some form of planned recovery is required. For many athletes that is at least one very low-load day, sometimes a true rest day.",
    ],
  },
  {
    id: "science",
    title: "What the Science Supports",
    color: C.blue,
    textColor: C.white,
    bullets: [
      "Training works by overload + recovery. If overload accumulates without adequate recovery, performance and health worsen (non-functional overreaching, overtraining syndrome).",
      "Poor load management is a recognized risk factor for illness and overtraining outcomes in athletes.",
      "Higher training loads and fatigue markers are associated with increased injury and illness risk across sporting populations \u2014 the practical reason coaches build in recovery or lighter days.",
    ],
  },
  {
    id: "age-40",
    title: "Why 40+ Changes the Math",
    color: C.red,
    textColor: C.white,
    bullets: [
      "Aging muscle recovery tends to be more delayed and less efficient due to anabolic resistance and inflammation-related mechanisms, increasing the need for recovery relative to the same training dose.",
      "In active middle-aged men, recovery after an aerobic muscle-damage protocol was studied out to 48 hours, supporting that recovery timelines and responses differ by age.",
      "Translation: over 40, you can still train huge, but the margin for error is smaller. Many masters athletes do better with more deliberate \u201Ceasy or off\u201D structure to avoid chronic accumulation.",
    ],
  },
  {
    id: "zone2",
    title: "Do You Need a Full Day Off from Zone 2?",
    color: C.white,
    textColor: C.black,
    bullets: [
      "Not always. You need a day that is low enough load that it meaningfully improves recovery.",
      "Option A: True rest day (no structured training).",
      "Option B: Active recovery that is genuinely easy (often easier than people think).",
      "Option C: A recovery week or reduced-load microcycle if your program is periodized.",
      "ACSM notes: during tough training seasons, athletes should prioritize true rest days without structured exercise, using only lifestyle movement or gentle mobility.",
    ],
  },
  {
    id: "take-day-off",
    title: "When a True Day Off Is the Right Call",
    color: C.orange,
    textColor: C.black,
    bullets: [
      "If ANY of these are present, a full day off is commonly justified because they signal inadequate recovery relative to load:",
      "Performance stagnation or decline despite consistent training.",
      "Rising illness frequency or lingering fatigue.",
      "Overuse injury trend (niggles becoming persistent).",
      "You are stacking many days with similar load (monotony) and not reducing strain with true easy days \u2014 a known risk context for overuse problems and maladaptation.",
    ],
  },
  {
    id: "zone2-ok",
    title: "When Zone 2 on Recovery Day Is Fine",
    color: C.green,
    textColor: C.white,
    bullets: [
      "If Zone 2 is actually easy enough to lower overall stress, and you are not showing the red flags above, Zone 2 can function as active recovery.",
      "The key caveat: \u201CZone 2\u201D workouts often drift into moderate intensity or become too long, turning the \u201Crecovery day\u201D into another training day \u2014 which defeats the purpose described in load and recovery consensus guidance.",
    ],
  },
];

/* ───────────────────────── EXPANDABLE NOTE CARD ───────────────────────── */
function NoteCard({ section, isOpen, onToggle }: { section: NoteSection; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      style={{
        background: section.color,
        borderRadius: 16,
        border: `3px solid ${C.black}`,
        overflow: "hidden",
        cursor: "pointer",
      }}
      onClick={onToggle}
    >
      {/* Header — always visible */}
      <div
        style={{
          padding: "16px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: section.textColor,
            fontFamily,
            lineHeight: 1.2,
            flex: 1,
            paddingRight: 12,
          }}
        >
          {section.title}
        </span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: section.textColor,
            opacity: 0.6,
            flexShrink: 0,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            lineHeight: 1,
          }}
        >
          &#9660;
        </span>
      </div>

      {/* Expandable content */}
      {isOpen && (
        <div style={{ padding: "0 18px 18px" }}>
          <div
            style={{
              borderTop: `2px solid ${section.textColor === C.white ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.12)"}`,
              paddingTop: 14,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {section.bullets.map((bullet, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: section.textColor,
                    opacity: 0.5,
                    flexShrink: 0,
                    marginTop: 7,
                  }}
                />
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: section.textColor,
                    fontFamily,
                    margin: 0,
                    lineHeight: 1.5,
                    opacity: 0.9,
                  }}
                >
                  {bullet}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── MAIN COMPONENT ───────────────────────── */
export default function SaturdayRestPage() {
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});

  const toggleNote = (id: string) => {
    setOpenNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ background: C.yellow, minHeight: "100vh", fontFamily }}>
      {/* HEADER */}
      <header style={{ background: C.yellow, borderBottom: `4px solid ${C.black}`, padding: "16px 16px 12px" }}>
        <Link href="/workouts" style={{ textDecoration: "none", color: C.black, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
          &#8592; Workouts
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: C.black, margin: 0, fontFamily }}>Saturday</h1>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.black, margin: "2px 0 0", fontFamily }}>Rest Day</p>
          </div>
          <div style={{
            background: C.black, borderRadius: 999, padding: "6px 14px",
            display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: C.yellow, fontFamily, lineHeight: 1 }}>{daysToRace()}</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: C.white, fontFamily, letterSpacing: 1, textTransform: "uppercase" }}>DAYS TO RACE</span>
          </div>
        </div>
      </header>

      {/* REST DAY CONTENT */}
      <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        {/* Sun SVG */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
          <rect width="200" height="200" fill={C.yellow} rx="20" />
          <circle cx="100" cy="100" r="50" fill={C.white} stroke={C.black} strokeWidth="3" />
          <circle cx="100" cy="100" r="30" fill={C.yellow} stroke={C.black} strokeWidth="2" />
          {/* Rays */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45) * (Math.PI / 180);
            const x1 = 100 + Math.cos(angle) * 55;
            const y1 = 100 + Math.sin(angle) * 55;
            const x2 = 100 + Math.cos(angle) * 75;
            const y2 = 100 + Math.sin(angle) * 75;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.black} strokeWidth="4" strokeLinecap="round" />;
          })}
          {/* Face */}
          <circle cx="88" cy="92" r="4" fill={C.black} />
          <circle cx="112" cy="92" r="4" fill={C.black} />
          <path d="M 85 110 Q 100 125 115 110" fill="none" stroke={C.black} strokeWidth="3" strokeLinecap="round" />
        </svg>

        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: C.black, margin: "0 0 8px", fontFamily }}>
            Recovery Day
          </h2>
          <p style={{ fontSize: 16, fontWeight: 600, color: C.black, margin: "0 0 24px", fontFamily, opacity: 0.6, lineHeight: 1.5 }}>
            Your body builds strength while it rests. Today is part of the program — not a day off from it.
          </p>
        </div>

        {/* Recovery suggestions */}
        <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { icon: "💤", label: "Sleep 8+ hours", desc: "Growth hormone peaks during deep sleep" },
            { icon: "💧", label: "Hydrate well", desc: "Target 80–100 oz of water today" },
            { icon: "🧘", label: "Light stretching", desc: "10 min gentle mobility if you feel tight" },
            { icon: "🍳", label: "Eat to recover", desc: "Hit your protein target — muscles are rebuilding" },
            { icon: "📵", label: "Mental rest", desc: "Reduce screen time, get outside" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: C.white, borderRadius: 14,
                border: `3px solid ${C.black}`, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 14,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: C.yellow, border: `3px solid ${C.black}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.black, fontFamily }}>{item.label}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.black, fontFamily, opacity: 0.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Motivational footer */}
        <div style={{
          marginTop: 16, background: C.black, borderRadius: 14,
          padding: "16px 20px", maxWidth: 360, width: "100%",
          border: `3px solid ${C.black}`,
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.yellow, fontFamily, margin: 0, textAlign: "center", lineHeight: 1.5 }}>
            &ldquo;The body does not get stronger during the workout. It gets stronger during the recovery.&rdquo;
          </p>
        </div>

        {/* ───── REST DAY SCIENCE NOTES ───── */}
        <div style={{ width: "100%", maxWidth: 360, marginTop: 16 }}>
          <h3 style={{
            fontSize: 22, fontWeight: 800, color: C.black, fontFamily,
            margin: "0 0 4px", letterSpacing: -0.5,
          }}>
            Rest Day Science
          </h3>
          <p style={{
            fontSize: 13, fontWeight: 600, color: C.black, fontFamily,
            opacity: 0.5, margin: "0 0 16px", lineHeight: 1.4,
          }}>
            Must you take a full day off? Tap each section.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {REST_DAY_NOTES.map((section) => (
              <NoteCard
                key={section.id}
                section={section}
                isOpen={!!openNotes[section.id]}
                onToggle={() => toggleNote(section.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
