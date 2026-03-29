"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { C, fontFamily } from "./WorkoutPage";

/* ───────────────────────── AUDIO ───────────────────────── */
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

function playChime(count: 1 | 2 = 1) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  for (let i = 0; i < count; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 800;
    gain.gain.value = 0.3;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.35 + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.35);
    osc.stop(ctx.currentTime + i * 0.35 + 0.25);
  }
}

/* ───────────────────────── FORMAT ───────────────────────── */
function fmt(seconds: number): string {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.abs(seconds) % 60;
  return m > 0
    ? `${m}:${s.toString().padStart(2, "0")}`
    : `${s}`;
}

/* ───────────────────────── TIMER STATES ───────────────────────── */
type TimerPhase = "ready" | "active" | "rest" | "done";

interface SetTimerProps {
  exerciseSeconds: number;
  restSeconds: number;
  currentSet: number;
  totalSets: number;
  onSetComplete?: () => void;
}

export default function SetTimer({
  exerciseSeconds,
  restSeconds,
  currentSet,
  totalSets,
  onSetComplete,
}: SetTimerProps) {
  const [phase, setPhase] = useState<TimerPhase>("ready");
  const [remaining, setRemaining] = useState(exerciseSeconds);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setPhase("ready");
    setRemaining(exerciseSeconds);
    setElapsed(0);
    setPaused(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [currentSet, exerciseSeconds]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTick = useCallback(
    (duration: number, onComplete: () => void) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRemaining(duration);
      setElapsed(0);
      setPaused(false);

      let timeLeft = duration;
      let timeElapsed = 0;
      intervalRef.current = setInterval(() => {
        timeLeft -= 1;
        timeElapsed += 1;
        setRemaining(timeLeft);
        setElapsed(timeElapsed);
        if (timeLeft <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onComplete();
        }
      }, 1000);
    },
    [],
  );

  const startExercise = useCallback(() => {
    getAudioCtx();
    setPhase("active");
    startTick(exerciseSeconds, () => {
      playChime(1);
      onSetComplete?.();
      if (currentSet < totalSets - 1) {
        setPhase("rest");
        startTick(restSeconds, () => {
          playChime(2);
          setPhase("done");
        });
      } else {
        setPhase("done");
      }
    });
  }, [exerciseSeconds, restSeconds, currentSet, totalSets, startTick, onSetComplete]);

  const togglePause = useCallback(() => {
    if (phase === "ready" || phase === "done") return;
    if (paused) {
      const currentRemaining = remaining;
      const currentElapsed = elapsed;
      const isRest = phase === "rest";
      if (intervalRef.current) clearInterval(intervalRef.current);

      let timeLeft = currentRemaining;
      let timeElapsed = currentElapsed;
      intervalRef.current = setInterval(() => {
        timeLeft -= 1;
        timeElapsed += 1;
        setRemaining(timeLeft);
        setElapsed(timeElapsed);
        if (timeLeft <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (isRest) {
            playChime(2);
            setPhase("done");
          } else {
            playChime(1);
            onSetComplete?.();
            if (currentSet < totalSets - 1) {
              setPhase("rest");
              startTick(restSeconds, () => {
                playChime(2);
                setPhase("done");
              });
            } else {
              setPhase("done");
            }
          }
        }
      }, 1000);
      setPaused(false);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPaused(true);
    }
  }, [phase, paused, remaining, elapsed, restSeconds, currentSet, totalSets, startTick, onSetComplete]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("ready");
    setRemaining(exerciseSeconds);
    setElapsed(0);
    setPaused(false);
  }, [exerciseSeconds]);

  const isWarning = (phase === "rest" && remaining <= 10) || (phase === "active" && remaining <= 3);

  /* ── Phase config ── */
  let label = "";
  if (phase === "ready") label = "TAP TO START";
  else if (phase === "active") label = paused ? "PAUSED" : "GO";
  else if (phase === "rest") label = paused ? "PAUSED" : "REST";
  else label = currentSet < totalSets - 1 ? "SET DONE — TAP FOR NEXT" : "COMPLETE";

  let bg: string = C.yellow;
  let textColor: string = C.black;
  if (phase === "active") { bg = C.green; textColor = C.white; }
  if (phase === "rest") { bg = C.blue; textColor = C.white; }
  if (isWarning) { bg = C.red; textColor = C.white; }
  if (phase === "done") { bg = C.black; textColor = C.yellow; }

  const isRunning = phase === "active" || phase === "rest";

  return (
    <button
      onClick={() => {
        if (phase === "ready") startExercise();
        else if (phase === "done") reset();
        else togglePause();
      }}
      style={{
        width: "100%",
        border: `4px solid ${C.black}`,
        borderRadius: 20,
        padding: 0,
        background: bg,
        cursor: "pointer",
        fontFamily,
        marginBottom: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "hidden",
        transition: "background 0.3s ease",
      }}
    >
      {/* Dual display — elapsed left, remaining right */}
      {isRunning ? (
        <div style={{
          display: "flex",
          width: "100%",
          minHeight: 200,
        }}>
          {/* Elapsed (stopwatch) */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "28px 12px",
            borderRight: `3px solid ${textColor}`,
            opacity: 0.7,
          }}>
            <div style={{
              fontSize: 18,
              fontWeight: 800,
              color: textColor,
              textTransform: "uppercase",
              letterSpacing: 2,
              fontFamily,
              marginBottom: 8,
            }}>
              Elapsed
            </div>
            <div style={{
              fontSize: 56,
              fontWeight: 800,
              color: textColor,
              lineHeight: 1,
              fontFamily,
              fontVariantNumeric: "tabular-nums",
            }}>
              {fmt(elapsed)}
            </div>
          </div>

          {/* Remaining (countdown) */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "28px 12px",
          }}>
            <div style={{
              fontSize: 18,
              fontWeight: 800,
              color: textColor,
              textTransform: "uppercase",
              letterSpacing: 2,
              fontFamily,
              marginBottom: 8,
            }}>
              Left
            </div>
            <div style={{
              fontSize: 80,
              fontWeight: 800,
              color: textColor,
              lineHeight: 1,
              fontFamily,
              fontVariantNumeric: "tabular-nums",
              animation: isWarning ? "pulse 0.5s ease-in-out infinite alternate" : "none",
            }}>
              {fmt(remaining)}
            </div>
          </div>
        </div>
      ) : (
        /* Ready / Done — single large display */
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "36px 16px 28px",
          minHeight: 180,
          width: "100%",
        }}>
          <div style={{
            fontSize: 88,
            fontWeight: 800,
            color: textColor,
            lineHeight: 1,
            fontFamily,
            fontVariantNumeric: "tabular-nums",
          }}>
            {fmt(remaining)}
          </div>
        </div>
      )}

      {/* Phase label + set indicator */}
      <div style={{
        width: "100%",
        background: phase === "done" ? C.yellow : C.black,
        padding: "14px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{
          fontSize: 20,
          fontWeight: 800,
          color: phase === "done" ? C.black : C.white,
          textTransform: "uppercase",
          letterSpacing: 2,
          fontFamily,
        }}>
          {label}
        </div>
        {totalSets > 1 && (
          <div style={{
            fontSize: 16,
            fontWeight: 700,
            color: phase === "done" ? C.black : C.yellow,
            fontFamily,
          }}>
            Set {currentSet + 1}/{totalSets}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          from { transform: scale(1); }
          to { transform: scale(1.05); }
        }
      `}</style>
    </button>
  );
}
