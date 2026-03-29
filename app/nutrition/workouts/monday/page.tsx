"use client";

import WorkoutPage, { C, type Exercise } from "@/components/nutrition/WorkoutPage";

const HEIGHTS = [220, 250, 200, 250, 200, 250, 200, 250, 220, 270, 200, 250, 230, 280, 210, 260, 240, 290];
const STORAGE_KEY = "optimism-pop-monday-v2";

/* ───────────────────────── EXERCISE DATA ───────────────────────── */
const EXERCISES: Exercise[] = [
  /* ── Norwegian 4×4 — Stationary Bike ── */
  { id: "mon-n44-warmup", name: "Warm-Up", section: "norwegian", sectionLabel: "Norwegian 4×4", sets: 1, detail: "10 min", tip: "Start conversational pace. By minute 5 reach 50–60% HRmax, by minute 10 reach 65–75% HRmax." },
  { id: "mon-n44-int1", name: "Interval 1", section: "norwegian", sectionLabel: "Norwegian 4×4", sets: 1, detail: "4 min", tip: "Build to 85–95% HRmax in first minute, then sustain. Breathing heavy, conversation difficult. Cadence 85–95 RPM." },
  { id: "mon-n44-rec1", name: "Recovery 1", section: "norwegian", sectionLabel: "Norwegian 4×4", sets: 1, detail: "3 min", tip: "Keep pedaling — don't stop. Drop resistance significantly. Deep controlled breathing. Target 60–70% HRmax." },
  { id: "mon-n44-int2", name: "Interval 2", section: "norwegian", sectionLabel: "Norwegian 4×4", sets: 1, detail: "4 min", tip: "Same intensity as Interval 1. Mental toughness — maintain form and breathing rhythm. 85–95% HRmax." },
  { id: "mon-n44-rec2", name: "Recovery 2", section: "norwegian", sectionLabel: "Norwegian 4×4", sets: 1, detail: "3 min", tip: "Active recovery. Let HR drop to 60–70% HRmax but keep moving." },
  { id: "mon-n44-int3", name: "Interval 3", section: "norwegian", sectionLabel: "Norwegian 4×4", sets: 1, detail: "4 min", tip: "Hardest interval mentally. Break it into 1-minute segments. \"I can do anything for 4 minutes.\" 85–95% HRmax." },
  { id: "mon-n44-rec3", name: "Recovery 3", section: "norwegian", sectionLabel: "Norwegian 4×4", sets: 1, detail: "3 min", tip: "Last recovery. Prepare mentally for final push. 60–70% HRmax." },
  { id: "mon-n44-int4", name: "Interval 4", section: "norwegian", sectionLabel: "Norwegian 4×4", sets: 1, detail: "4 min", tip: "Final push — give it everything. Can push slightly higher if feeling good. 85–95% HRmax." },
  { id: "mon-n44-cooldown", name: "Cool-Down", section: "norwegian", sectionLabel: "Norwegian 4×4", sets: 1, detail: "10 min", tip: "Gradually decrease intensity. HR below 60% HRmax. Static stretch quads, hamstrings, calves, hip flexors 30s each." },
  /* ── Complex 1: Pull then Push ── */
  { id: "mon-rows", name: "Rows", section: "complex-1", sectionLabel: "Complex 1", sets: 4, detail: "12 reps · your choice", tip: "Cable, barbell, or dumbbell rows. Full range of motion, squeeze at top." },
  { id: "mon-bench", name: "Bench Press", section: "complex-1", sectionLabel: "Complex 1", sets: 4, detail: "12 reps · bar or DB", tip: "Control the descent, press through the full range. Keep shoulder blades pinched." },
  { id: "mon-crunches-1", name: "Crunches", section: "complex-1", sectionLabel: "Complex 1", sets: 4, detail: "20 reps", tip: "Slow and controlled. Focus on the contraction, not speed." },
  /* ── Complex 2 ── */
  { id: "mon-pulldowns", name: "Lat Pull-Downs", section: "complex-2", sectionLabel: "Complex 2", sets: 4, detail: "10 reps", tip: "Lean back slightly, pull to upper chest. Squeeze lats at bottom." },
  { id: "mon-shoulder-press", name: "Shoulder Press", section: "complex-2", sectionLabel: "Complex 2", sets: 4, detail: "10 reps", tip: "Press overhead fully. Keep core tight, don't arch excessively." },
  { id: "mon-plank-squeeze", name: "Plank Squeeze", section: "complex-2", sectionLabel: "Complex 2", sets: 4, detail: "10 sec hold", tip: "Hold plank position and actively squeeze every muscle. Full body tension." },
  /* ── Finishers ── */
  { id: "mon-dead-hang", name: "Dead Hang", section: "finishers", sectionLabel: "Finishers", sets: 1, detail: "Max time", tip: "Grip the bar, relax shoulders, breathe. Go as long as you can." },
  { id: "mon-chest-stretch", name: "Chest Stretch", section: "finishers", sectionLabel: "Finishers", sets: 1, detail: "30–45 sec", tip: "Doorway or wall stretch. Open up after all the pressing work." },
  { id: "mon-foam-roll-legs", name: "Leg Foam Roll", section: "finishers", sectionLabel: "Finishers", sets: 1, detail: "3 min · all areas", tip: "Roll quads, hamstrings, calves, IT band. Prep for tomorrow's lower day." },
];

const SECTIONS = ["norwegian", "complex-1", "complex-2", "finishers"];
const SECTION_NAMES: Record<string, string> = { norwegian: "Norwegian 4×4", "complex-1": "Complex 1", "complex-2": "Complex 2", finishers: "Finishers" };

/* ───────────────────────── SVG ART ───────────────────────── */
function ExerciseSVG({ id }: { id: string }) {
  const s = `0 0 200 200`;
  const common = { xmlns: "http://www.w3.org/2000/svg", viewBox: s, width: "100%", height: "100%", preserveAspectRatio: "xMidYMid slice" as const };

  switch (id) {
    /* ── Norwegian 4×4 SVG Art ── */
    case "mon-n44-warmup":
      return (<svg {...common}><rect width="200" height="200" fill={C.blue}/>
        <circle cx="100" cy="100" r="30" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <circle cx="100" cy="100" r="50" fill="none" stroke={C.orange} strokeWidth="3"/>
        <circle cx="100" cy="100" r="70" fill="none" stroke={C.orange} strokeWidth="3"/>
        <circle cx="100" cy="100" r="90" fill="none" stroke={C.yellow} strokeWidth="3"/>
        <polygon points="95,80 105,80 100,65" fill={C.black}/>
        <polygon points="95,120 105,120 100,135" fill={C.black}/></svg>);
    case "mon-n44-int1":
    case "mon-n44-int2":
    case "mon-n44-int3":
    case "mon-n44-int4":
      return (<svg {...common}><rect width="200" height="200" fill={C.black}/>
        <polygon points="60,180 100,30 140,180" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <polygon points="75,180 100,65 125,180" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <polygon points="90,180 100,100 110,180" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <rect x="0" y="180" width="200" height="20" fill={C.black}/></svg>);
    case "mon-n44-rec1":
    case "mon-n44-rec2":
    case "mon-n44-rec3":
      return (<svg {...common}><rect width="200" height="200" fill={C.teal}/>
        <path d="M 0 80 Q 25 60 50 80 Q 75 100 100 80 Q 125 60 150 80 Q 175 100 200 80" fill="none" stroke={C.blue} strokeWidth="4"/>
        <path d="M 0 110 Q 25 90 50 110 Q 75 130 100 110 Q 125 90 150 110 Q 175 130 200 110" fill="none" stroke={C.white} strokeWidth="4"/>
        <path d="M 0 140 Q 25 120 50 140 Q 75 160 100 140 Q 125 120 150 140 Q 175 160 200 140" fill="none" stroke={C.blue} strokeWidth="4"/></svg>);
    case "mon-n44-cooldown":
      return (<svg {...common}><rect width="200" height="200" fill={C.blue}/>
        <rect x="0" y="140" width="200" height="60" fill={C.black}/>
        <circle cx="100" cy="70" r="40" fill={C.orange} stroke={C.black} strokeWidth="3"/>
        <path d="M 0 140 Q 50 120 100 140 Q 150 160 200 140" fill={C.blue} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="30" x2="100" y2="10" stroke={C.yellow} strokeWidth="3"/>
        <line x1="130" y1="40" x2="145" y2="25" stroke={C.yellow} strokeWidth="3"/>
        <line x1="70" y1="40" x2="55" y2="25" stroke={C.yellow} strokeWidth="3"/></svg>);
    case "mon-rows":
      return (<svg {...common}><rect width="200" height="200" fill={C.red}/>
        <rect x="25" y="75" width="150" height="12" rx="6" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <circle cx="100" cy="45" r="14" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="59" x2="100" y2="95" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="100" cy="115" rx="22" ry="28" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="143" x2="75" y2="185" stroke={C.black} strokeWidth="3"/><line x1="100" y1="143" x2="125" y2="185" stroke={C.black} strokeWidth="3"/>
        <line x1="75" y1="95" x2="35" y2="75" stroke={C.black} strokeWidth="3"/><line x1="125" y1="95" x2="165" y2="75" stroke={C.black} strokeWidth="3"/>
        <polygon points="88,75 100,55 112,75" fill={C.black}/></svg>);
    case "mon-bench":
      return (<svg {...common}><rect width="200" height="200" fill={C.orange}/>
        <rect x="0" y="155" width="200" height="45" fill={C.black}/>
        <rect x="25" y="95" width="150" height="10" rx="5" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <circle cx="100" cy="75" r="14" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="89" x2="100" y2="115" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="100" cy="130" rx="35" ry="22" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="152" x2="80" y2="195" stroke={C.black} strokeWidth="3"/><line x1="100" y1="152" x2="120" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="70" y1="105" x2="35" y2="95" stroke={C.black} strokeWidth="3"/><line x1="130" y1="105" x2="165" y2="95" stroke={C.black} strokeWidth="3"/>
        <polygon points="88,95 100,75 112,95" fill={C.black}/></svg>);
    case "mon-crunches-1":
      return (<svg {...common}><rect width="200" height="200" fill={C.yellow}/>
        <rect x="0" y="155" width="200" height="45" fill={C.black}/>
        <circle cx="100" cy="75" r="14" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="89" x2="100" y2="115" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="100" cy="135" rx="40" ry="18" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="153" x2="80" y2="195" stroke={C.black} strokeWidth="3"/><line x1="100" y1="153" x2="120" y2="195" stroke={C.black} strokeWidth="3"/>
        <path d="M 85 115 Q 100 95 115 115" fill="none" stroke={C.black} strokeWidth="3"/>
        <polygon points="92,100 100,85 108,100" fill={C.black}/></svg>);
    case "mon-pulldowns":
      return (<svg {...common}><rect width="200" height="200" fill={C.teal}/>
        <rect x="35" y="15" width="130" height="12" rx="6" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="27" x2="100" y2="75" stroke={C.black} strokeWidth="3"/>
        <circle cx="100" cy="95" r="14" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="109" x2="100" y2="140" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="100" cy="160" rx="25" ry="20" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="75" x2="65" y2="45" stroke={C.black} strokeWidth="3"/><line x1="100" y1="75" x2="135" y2="45" stroke={C.black} strokeWidth="3"/>
        <line x1="65" y1="45" x2="55" y2="27" stroke={C.black} strokeWidth="3"/><line x1="135" y1="45" x2="145" y2="27" stroke={C.black} strokeWidth="3"/>
        <polygon points="92,55 100,40 108,55" fill={C.black}/></svg>);
    case "mon-shoulder-press":
      return (<svg {...common}><rect width="200" height="200" fill={C.blue}/>
        <rect x="0" y="172" width="200" height="28" fill={C.black}/>
        <circle cx="100" cy="55" r="14" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="69" x2="100" y2="135" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="100" cy="150" rx="22" ry="18" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="168" x2="80" y2="195" stroke={C.black} strokeWidth="3"/><line x1="100" y1="168" x2="120" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="75" y1="95" x2="55" y2="35" stroke={C.black} strokeWidth="3"/><line x1="125" y1="95" x2="145" y2="35" stroke={C.black} strokeWidth="3"/>
        <rect x="48" y="22" width="18" height="16" rx="4" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <rect x="134" y="22" width="18" height="16" rx="4" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <polygon points="92,35 100,22 108,35" fill={C.black}/></svg>);
    case "mon-plank-squeeze":
      return (<svg {...common}><rect width="200" height="200" fill={C.green}/>
        <rect x="0" y="155" width="200" height="45" fill={C.yellow}/>
        <circle cx="100" cy="95" r="14" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="109" x2="100" y2="135" stroke={C.black} strokeWidth="3"/>
        <rect x="70" y="135" width="60" height="12" rx="4" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="40" y1="135" x2="100" y2="135" stroke={C.black} strokeWidth="3"/>
        <line x1="160" y1="135" x2="100" y2="135" stroke={C.black} strokeWidth="3"/>
        <line x1="40" y1="135" x2="35" y2="155" stroke={C.black} strokeWidth="3"/><line x1="40" y1="147" x2="35" y2="155" stroke={C.black} strokeWidth="3"/>
        <line x1="160" y1="135" x2="165" y2="155" stroke={C.black} strokeWidth="3"/><line x1="160" y1="147" x2="165" y2="155" stroke={C.black} strokeWidth="3"/></svg>);
    case "mon-dead-hang":
      return (<svg {...common}><rect width="200" height="200" fill={C.black}/>
        <rect x="35" y="18" width="130" height="14" rx="7" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="32" x2="100" y2="58" stroke={C.yellow} strokeWidth="3"/>
        <circle cx="100" cy="75" r="14" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="89" x2="100" y2="145" stroke={C.yellow} strokeWidth="3"/>
        <ellipse cx="100" cy="165" rx="18" ry="15" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="58" x2="75" y2="32" stroke={C.yellow} strokeWidth="3"/><line x1="100" y1="58" x2="125" y2="32" stroke={C.yellow} strokeWidth="3"/>
        <line x1="100" y1="145" x2="82" y2="190" stroke={C.yellow} strokeWidth="3"/><line x1="100" y1="145" x2="118" y2="190" stroke={C.yellow} strokeWidth="3"/></svg>);
    case "mon-chest-stretch":
      return (<svg {...common}><rect width="200" height="200" fill={C.yellow}/>
        <rect x="0" y="0" width="35" height="200" fill={C.black}/>
        <circle cx="100" cy="75" r="14" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="89" x2="100" y2="130" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="100" cy="150" rx="22" ry="20" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="168" x2="85" y2="195" stroke={C.black} strokeWidth="3"/><line x1="100" y1="168" x2="115" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="105" x2="35" y2="75" stroke={C.black} strokeWidth="3"/><line x1="100" y1="105" x2="165" y2="75" stroke={C.black} strokeWidth="3"/>
        <circle cx="165" cy="75" r="10" fill={C.blue} stroke={C.black} strokeWidth="3"/></svg>);
    case "mon-foam-roll-legs":
      return (<svg {...common}><rect width="200" height="200" fill={C.teal}/>
        <ellipse cx="100" cy="95" rx="55" ry="18" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <rect x="20" y="100" width="160" height="22" rx="11" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <circle cx="100" cy="65" r="12" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="77" x2="100" y2="95" stroke={C.black} strokeWidth="3"/>
        <line x1="55" y1="95" x2="45" y2="195" stroke={C.black} strokeWidth="3"/><line x1="145" y1="95" x2="155" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="45" y1="195" x2="35" y2="200" stroke={C.black} strokeWidth="3"/><line x1="155" y1="195" x2="165" y2="200" stroke={C.black} strokeWidth="3"/></svg>);
    default:
      return (<svg {...common}><rect width="200" height="200" fill={C.blue}/><circle cx="100" cy="100" r="50" fill={C.yellow} stroke={C.black} strokeWidth="3"/></svg>);
  }
}

export default function MondayWorkoutPage() {
  return (
    <WorkoutPage
      exercises={EXERCISES}
      sections={SECTIONS}
      sectionNames={SECTION_NAMES}
      storageKey={STORAGE_KEY}
      heights={HEIGHTS}
      art={ExerciseSVG}
      title="Monday"
      subtitle="Norwegian 4×4 + Upper A · Week 2"
    />
  );
}
