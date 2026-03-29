"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { NotificationIcon, MenuIcon } from "@/components/nutrition/PageHeaderIcons";

/* ───────────────────────── PALETTE — PRIMARY ONLY ───────────────────────── */
const C = {
  red: "#DC3535",
  blue: "#1D5D9B",
  yellow: "#FFE15D",
  black: "#1A1A1A",
  white: "#FFFFFF",
} as const;

const fontFamily = `var(--font-outfit), 'Avenir Next', 'Helvetica Neue', sans-serif`;

/* ───────────────────────── DAY CONFIGS ───────────────────────── */
/* Color logic: run days = red, lower days = yellow, upper/cross = blue, rest = white */
interface DayConfig {
  key: string;
  label: string;
  type: string;
  bg: string;
  textColor: string;
  storageKey: string | null;
}

const DAYS: DayConfig[] = [
  { key: "sunday",    label: "Sunday",    type: "Long Run",             bg: C.red,    textColor: C.white, storageKey: "optimism-pop-sunday-v1" },
  { key: "monday",    label: "Monday",    type: "Upper A + Bike",       bg: C.blue,   textColor: C.white, storageKey: "optimism-pop-monday-v1" },
  { key: "tuesday",   label: "Tuesday",   type: "Lower Strength A",     bg: C.yellow, textColor: C.black, storageKey: "optimism-pop-tuesday-v1" },
  { key: "wednesday", label: "Wednesday", type: "Upper B + Cardio",     bg: C.blue,   textColor: C.white, storageKey: "optimism-pop-wednesday-v1" },
  { key: "thursday",  label: "Thursday",  type: "Run Skills",           bg: C.red,    textColor: C.white, storageKey: "optimism-pop-v1" },
  { key: "friday",    label: "Friday",    type: "Lower Strength B",     bg: C.yellow, textColor: C.black, storageKey: "optimism-pop-friday-v1" },
  { key: "saturday",  label: "Saturday",  type: "Rest",                 bg: C.white,  textColor: C.black, storageKey: null },
];

/* ───────────────────────── HELPERS ───────────────────────── */
function daysToRace(): number {
  const race = new Date("2026-05-03T00:00:00");
  const now = new Date();
  return Math.max(0, Math.ceil((race.getTime() - now.getTime()) / 86400000));
}

/* Decorative SVG shape per card — Lichtenstein pop art: bold, simple, primary */
function CardShape({ bg }: { bg: string }) {
  const light = "rgba(255,255,255,0.14)";
  const dark = "rgba(0,0,0,0.08)";

  if (bg === C.red) {
    /* Bold concentric circles — Lichtenstein target */
    return (
      <svg style={{ position: "absolute", right: -20, top: "50%", transform: "translateY(-50%)", width: 180, height: 180 }} viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="95" fill={light} />
        <circle cx="100" cy="100" r="60" fill={light} />
        <circle cx="100" cy="100" r="28" fill={light} />
      </svg>
    );
  }
  if (bg === C.blue) {
    /* Bold vertical bars — graphic, structural */
    return (
      <svg style={{ position: "absolute", right: 10, top: 0, width: 140, height: "100%", opacity: 1 }} viewBox="0 0 140 200" preserveAspectRatio="none">
        <rect x="25" y="0" width="30" height="200" fill={light} />
        <rect x="80" y="0" width="30" height="200" fill={light} />
      </svg>
    );
  }
  if (bg === C.yellow) {
    /* Ben-Day dots — THE Lichtenstein signature */
    return (
      <svg style={{ position: "absolute", right: 0, top: 0, width: "100%", height: "100%", opacity: 1 }} viewBox="0 0 200 140" preserveAspectRatio="xMaxYMid slice">
        {[0,1,2,3,4,5,6].map(row =>
          [0,1,2,3,4,5,6,7,8].map(col => (
            <circle key={`${row}-${col}`} cx={col * 26 + (row % 2 ? 13 : 0)} cy={row * 22 + 11} r="6" fill={dark} />
          ))
        )}
      </svg>
    );
  }
  if (bg === C.white) {
    /* Single bold circle — clean, minimal */
    return (
      <svg style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", width: 90, height: 90 }} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke={dark} strokeWidth="5" />
      </svg>
    );
  }
  return null;
}

/* ───────────────────────── MAIN ───────────────────────── */
export default function WorkoutsLandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const todayIdx = new Date().getDay();

  if (!mounted) {
    return <div style={{ background: C.black, minHeight: "100vh" }} />;
  }

  return (
    <div style={{ background: C.black, minHeight: "100vh", fontFamily, paddingBottom: 88 }}>
      {/* ── HEADER — compact, stays out of the way ── */}
      <header style={{ padding: "20px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 10, background: C.white + "14", textDecoration: "none" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.yellow} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <NotificationIcon iconColor={C.yellow} bgColor={C.white + "14"} size={32} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.yellow, margin: 0, fontFamily, letterSpacing: -0.5 }}>Training Week</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            background: C.yellow, borderRadius: 999, padding: "4px 12px",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.black, fontFamily, lineHeight: 1 }}>{daysToRace()}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.black, fontFamily, letterSpacing: 0.5, textTransform: "uppercase", opacity: 0.6 }}>days</span>
          </div>
          <MenuIcon iconColor={C.yellow} bgColor={C.white + "14"} size={32} />
        </div>
      </header>

      {/* ── DAY CARDS — the feed ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 10px" }}>
        {DAYS.map((day, i) => {
          const isToday = i === todayIdx;
          const isRest = day.key === "saturday";
          return (
            <Link key={day.key} href={`/workouts/${day.key}`} style={{ textDecoration: "none" }}>
              <div style={{
                background: day.bg,
                borderRadius: 20,
                padding: "28px 24px",
                minHeight: isToday ? 160 : 130,
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                border: isToday ? `5px solid ${C.white}` : `4px solid ${day.bg === C.white ? C.black : day.bg}`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}>
                {/* Decorative shape */}
                <CardShape bg={day.bg} />

                {/* Content */}
                <div style={{ position: "relative", zIndex: 1 }}>
                  {/* TODAY badge */}
                  {isToday && (
                    <div style={{
                      fontSize: 11, fontWeight: 800, color: C.black,
                      background: C.white, borderRadius: 999,
                      padding: "3px 12px", display: "inline-block",
                      marginBottom: 8, letterSpacing: 1.5, textTransform: "uppercase",
                      fontFamily,
                    }}>
                      TODAY
                    </div>
                  )}

                  {/* Day name + type — massive label, type to the right */}
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                    <span style={{
                      fontSize: isToday ? 52 : 44,
                      fontWeight: 800,
                      color: day.textColor,
                      fontFamily,
                      lineHeight: 1,
                      letterSpacing: -1,
                    }}>
                      {day.label}
                    </span>
                    <span style={{
                      fontSize: isRest ? 16 : 15,
                      fontWeight: 700,
                      color: day.textColor,
                      fontFamily,
                      opacity: isRest ? 0.4 : 0.7,
                      textAlign: "right",
                      flexShrink: 0,
                      lineHeight: 1.2,
                      maxWidth: 120,
                    }}>
                      {day.type}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
