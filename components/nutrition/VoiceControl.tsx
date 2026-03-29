"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { C, fontFamily } from "./WorkoutPage";



/* ───────────────────────── COMMANDS ───────────────────────── */
interface VoiceCallbacks {
  onDone: () => void;
  onNext: () => void;
  onPrev: () => void;
  onWeight: (lbs: number) => void;
  onNote: (text: string) => void;
}

// Map spoken number words to digits
const WORD_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, "twenty-five": 25, thirty: 30,
  "thirty-five": 35, forty: 40, "forty-five": 45, fifty: 50,
  "fifty-five": 55, sixty: 60, "sixty-five": 65, seventy: 70,
  "seventy-five": 75, eighty: 80, "eighty-five": 85, ninety: 90,
  "ninety-five": 95, hundred: 100,
};

function parseCommand(transcript: string, cbs: VoiceCallbacks): boolean {
  const t = transcript.toLowerCase().trim();

  // "done" / "finished" → mark set complete
  if (/\b(done|finished|complete)\b/.test(t)) {
    cbs.onDone();
    return true;
  }
  // "next"
  if (/\bnext\b/.test(t)) {
    cbs.onNext();
    return true;
  }
  // "back" / "previous"
  if (/\b(back|previous)\b/.test(t)) {
    cbs.onPrev();
    return true;
  }
  // Number → weight
  const numMatch = t.match(/\b(\d+)\b/);
  if (numMatch) {
    cbs.onWeight(parseInt(numMatch[1], 10));
    return true;
  }
  // Word number → weight
  for (const [word, num] of Object.entries(WORD_NUMBERS)) {
    if (t.includes(word)) {
      cbs.onWeight(num);
      return true;
    }
  }
  // "note ..." → save note
  const noteMatch = t.match(/\bnote\s+(.+)/);
  if (noteMatch) {
    cbs.onNote(noteMatch[1]);
    return true;
  }

  return false;
}

/* ───────────────────────── COMPONENT ───────────────────────── */
interface VoiceControlProps {
  callbacks: VoiceCallbacks;
}

export default function VoiceControl({ callbacks }: VoiceControlProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SpeechRec);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    stopListening();

    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      if (last && last[0]) {
        const text = last[0].transcript;
        setTranscript(text);
        parseCommand(text, callbacksRef.current);
        // Clear transcript after 2 seconds
        setTimeout(() => setTranscript(""), 2000);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted" && event.error !== "no-speech") {
        console.warn("Speech recognition error:", event.error);
      }
      // Don't stop on no-speech — just keep listening
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if we're still supposed to be listening
      if (recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch {
          setListening(false);
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  if (!supported) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      {/* Mic button */}
      <button
        onClick={listening ? stopListening : startListening}
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: `3px solid ${C.black}`,
          background: listening ? C.green : C.white,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily,
          fontSize: 20,
          transition: "background 0.2s ease",
        }}
        aria-label={listening ? "Stop listening" : "Start voice control"}
        title={listening ? "Listening... (tap to stop)" : "Voice control"}
      >
        {/* Mic icon SVG */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={listening ? C.white : C.black}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>

      {/* Transcript feedback */}
      {transcript && (
        <div
          style={{
            background: C.black,
            color: C.yellow,
            padding: "4px 12px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            fontFamily,
            maxWidth: 200,
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {transcript}
        </div>
      )}
    </div>
  );
}
