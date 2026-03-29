"use client";

import WorkoutPage, { C, fontFamily, type Exercise } from "@/components/nutrition/WorkoutPage";

const HEIGHTS = [220, 250, 200, 250, 200, 250, 200, 250, 220, 270, 200, 250, 230, 280, 210, 260, 240];
const STORAGE_KEY = "optimism-pop-wednesday-v2";

/* ───────────────────────── EXERCISE DATA ───────────────────────── */
const EXERCISES: Exercise[] = [
  /* ── Norwegian 4×4 — Stationary Bike ── */
  { id: "wed-n44-warmup", name: "Warm-Up", section: "norwegian", sectionLabel: "Norwegian 4×4", sets: 1, detail: "10 min", tip: "Start conversational pace. By minute 5 reach 50–60% HRmax, by minute 10 reach 65–75% HRmax." },
  { id: "wed-n44-int1", name: "Interval 1", section: "norwegian", sectionLabel: "Norwegian 4×4", sets: 1, detail: "4 min", tip: "Build to 85–95% HRmax in first minute, then sustain. Breathing heavy, conversation difficult. Cadence 85–95 RPM." },
  { id: "wed-n44-rec1", name: "Recovery 1", section: "norwegian", sectionLabel: "Norwegian 4×4", sets: 1, detail: "3 min", tip: "Keep pedaling — don't stop. Drop resistance significantly. Deep controlled breathing. Target 60–70% HRmax." },
  { id: "wed-n44-int2", name: "Interval 2", section: "norwegian", sectionLabel: "Norwegian 4×4", sets: 1, detail: "4 min", tip: "Same intensity as Interval 1. Mental toughness — maintain form and breathing rhythm. 85–95% HRmax." },
  { id: "wed-n44-rec2", name: "Recovery 2", section: "norwegian", sectionLabel: "Norwegian 4×4", sets: 1, detail: "3 min", tip: "Active recovery. Let HR drop to 60–70% HRmax but keep moving." },
  { id: "wed-n44-int3", name: "Interval 3", section: "norwegian", sectionLabel: "Norwegian 4×4", sets: 1, detail: "4 min", tip: "Hardest interval mentally. Break it into 1-minute segments. \"I can do anything for 4 minutes.\" 85–95% HRmax." },
  { id: "wed-n44-rec3", name: "Recovery 3", section: "norwegian", sectionLabel: "Norwegian 4×4", sets: 1, detail: "3 min", tip: "Last recovery. Prepare mentally for final push. 60–70% HRmax." },
  { id: "wed-n44-int4", name: "Interval 4", section: "norwegian", sectionLabel: "Norwegian 4×4", sets: 1, detail: "4 min", tip: "Final push — give it everything. Can push slightly higher if feeling good. 85–95% HRmax." },
  { id: "wed-n44-cooldown", name: "Cool-Down", section: "norwegian", sectionLabel: "Norwegian 4×4", sets: 1, detail: "10 min", tip: "Gradually decrease intensity. HR below 60% HRmax. Static stretch quads, hamstrings, calves, hip flexors 30s each." },
  /* ── Push/Pull A ── */
  { id: "wed-tricep-ext", name: "Cable Tricep Extension", section: "upper-1", sectionLabel: "Push/Pull A", sets: 3, detail: "12 reps", tip: "Keep elbows tucked, extend fully. Squeeze at the bottom." },
  { id: "wed-bicep-curls", name: "Dumbbell Bicep Curls", section: "upper-1", sectionLabel: "Push/Pull A", sets: 3, detail: "12 reps", tip: "Full range of motion. Control the descent — don't swing." },
  { id: "wed-reverse-crunches", name: "Floor Reverse Crunches", section: "upper-1", sectionLabel: "Push/Pull A", sets: 3, detail: "10 reps", tip: "Curl hips off the ground, bringing knees toward chest. Lower with control." },
  /* ── Push/Pull B ── */
  { id: "wed-uni-chest-press", name: "Cable Uni Chest Press", section: "upper-2", sectionLabel: "Push/Pull B", sets: 3, detail: "12 each side", tip: "Big stagger stance. Press from chest, one arm at a time. Core stays engaged to resist rotation." },
  { id: "wed-uni-row", name: "Cable Uni Row", section: "upper-2", sectionLabel: "Push/Pull B", sets: 3, detail: "12 each side", tip: "Same stagger stance. Pull to ribcage, squeeze the shoulder blade. Don't rotate." },
  /* ── Finishers ── */
  { id: "wed-crunches", name: "Crunches", section: "finishers", sectionLabel: "Finishers", sets: 1, detail: "40 reps", tip: "Slow and controlled. Quality over speed." },
  { id: "wed-pullups", name: "Pull-Ups", section: "finishers", sectionLabel: "Finishers", sets: 2, detail: "Max reps", tip: "Full range. If you can't get 5+, use a band for assistance. Dead hang start, chin over bar." },
  { id: "wed-pushups", name: "Push-Ups", section: "finishers", sectionLabel: "Finishers", sets: 2, detail: "Max reps", tip: "Chest to floor, full lockout at top. Keep body straight." },
];

const SECTIONS = ["norwegian", "upper-1", "upper-2", "finishers"];
const SECTION_NAMES: Record<string, string> = { norwegian: "Norwegian 4×4", "upper-1": "Push/Pull A", "upper-2": "Push/Pull B", finishers: "Finishers" };

/* ───────────────────────── SVG ART ───────────────────────── */
function ExerciseSVG({ id }: { id: string }) {
  const s = `0 0 200 200`;
  const common = { xmlns: "http://www.w3.org/2000/svg", viewBox: s, width: "100%", height: "100%", preserveAspectRatio: "xMidYMid slice" as const };

  switch (id) {
    /* ── Norwegian 4×4 SVG Art ── */
    case "wed-n44-warmup":
      return (<svg {...common}><rect width="200" height="200" fill={C.blue}/>
        <circle cx="100" cy="100" r="30" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <circle cx="100" cy="100" r="50" fill="none" stroke={C.orange} strokeWidth="3"/>
        <circle cx="100" cy="100" r="70" fill="none" stroke={C.orange} strokeWidth="3"/>
        <circle cx="100" cy="100" r="90" fill="none" stroke={C.yellow} strokeWidth="3"/>
        <polygon points="95,80 105,80 100,65" fill={C.black}/>
        <polygon points="95,120 105,120 100,135" fill={C.black}/></svg>);
    case "wed-n44-int1":
    case "wed-n44-int2":
    case "wed-n44-int3":
    case "wed-n44-int4":
      return (<svg {...common}><rect width="200" height="200" fill={C.black}/>
        <polygon points="60,180 100,30 140,180" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <polygon points="75,180 100,65 125,180" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <polygon points="90,180 100,100 110,180" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <rect x="0" y="180" width="200" height="20" fill={C.black}/></svg>);
    case "wed-n44-rec1":
    case "wed-n44-rec2":
    case "wed-n44-rec3":
      return (<svg {...common}><rect width="200" height="200" fill={C.teal}/>
        <path d="M 0 80 Q 25 60 50 80 Q 75 100 100 80 Q 125 60 150 80 Q 175 100 200 80" fill="none" stroke={C.blue} strokeWidth="4"/>
        <path d="M 0 110 Q 25 90 50 110 Q 75 130 100 110 Q 125 90 150 110 Q 175 130 200 110" fill="none" stroke={C.white} strokeWidth="4"/>
        <path d="M 0 140 Q 25 120 50 140 Q 75 160 100 140 Q 125 120 150 140 Q 175 160 200 140" fill="none" stroke={C.blue} strokeWidth="4"/></svg>);
    case "wed-n44-cooldown":
      return (<svg {...common}><rect width="200" height="200" fill={C.blue}/>
        <rect x="0" y="140" width="200" height="60" fill={C.black}/>
        <circle cx="100" cy="70" r="40" fill={C.orange} stroke={C.black} strokeWidth="3"/>
        <path d="M 0 140 Q 50 120 100 140 Q 150 160 200 140" fill={C.blue} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="30" x2="100" y2="10" stroke={C.yellow} strokeWidth="3"/>
        <line x1="130" y1="40" x2="145" y2="25" stroke={C.yellow} strokeWidth="3"/>
        <line x1="70" y1="40" x2="55" y2="25" stroke={C.yellow} strokeWidth="3"/></svg>);
    case "wed-tricep-ext":
      return (<svg {...common}><rect width="200" height="200" fill={C.blue}/>
        <rect x="160" y="0" width="40" height="200" fill={C.black}/>
        <line x1="160" y1="85" x2="115" y2="85" stroke={C.red} strokeWidth="3"/>
        <circle cx="95" cy="55" r="14" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <line x1="95" y1="69" x2="95" y2="120" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="95" cy="145" rx="20" ry="22" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="80" y1="120" x2="80" y2="85" stroke={C.black} strokeWidth="3"/>
        <line x1="110" y1="120" x2="110" y2="85" stroke={C.black} strokeWidth="3"/>
        <line x1="95" y1="167" x2="80" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="95" y1="167" x2="110" y2="195" stroke={C.black} strokeWidth="3"/>
        <polygon points="90,85 95,75 100,85" fill={C.black}/></svg>);
    case "wed-bicep-curls":
      return (<svg {...common}><rect width="200" height="200" fill={C.orange}/>
        <rect x="0" y="172" width="200" height="28" fill={C.black}/>
        <circle cx="100" cy="50" r="14" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="64" x2="100" y2="115" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="100" cy="140" rx="22" ry="20" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="160" x2="80" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="160" x2="120" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="75" y1="95" x2="60" y2="95" stroke={C.black} strokeWidth="3"/>
        <line x1="125" y1="95" x2="140" y2="95" stroke={C.black} strokeWidth="3"/>
        <rect x="52" y="75" width="18" height="22" rx="4" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <rect x="130" y="75" width="18" height="22" rx="4" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <polygon points="88,95 100,80 112,95" fill={C.black}/></svg>);
    case "wed-reverse-crunches":
      return (<svg {...common}><rect width="200" height="200" fill={C.yellow}/>
        <rect x="0" y="155" width="200" height="45" fill={C.black}/>
        <circle cx="100" cy="75" r="14" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="89" x2="100" y2="115" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="100" cy="140" rx="45" ry="18" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <path d="M 75 140 Q 85 115 100 125 Q 115 135 125 140" fill="none" stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="158" x2="80" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="158" x2="120" y2="195" stroke={C.black} strokeWidth="3"/>
        <polygon points="92,155 100,135 108,155" fill={C.black}/></svg>);
    case "wed-uni-chest-press":
      return (<svg {...common}><rect width="200" height="200" fill={C.green}/>
        <rect x="0" y="0" width="35" height="200" fill={C.black}/>
        <line x1="35" y1="100" x2="95" y2="100" stroke={C.red} strokeWidth="3"/>
        <circle cx="115" cy="65" r="14" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <line x1="115" y1="79" x2="115" y2="125" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="115" cy="150" rx="18" ry="22" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="115" y1="100" x2="95" y2="100" stroke={C.black} strokeWidth="3"/>
        <line x1="115" y1="172" x2="100" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="115" y1="172" x2="135" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="130" y1="79" x2="155" y2="75" stroke={C.black} strokeWidth="3"/>
        <polygon points="148,72 160,78 148,84" fill={C.black}/></svg>);
    case "wed-uni-row":
      return (<svg {...common}><rect width="200" height="200" fill={C.red}/>
        <rect x="165" y="0" width="35" height="200" fill={C.black}/>
        <line x1="165" y1="100" x2="105" y2="100" stroke={C.yellow} strokeWidth="3"/>
        <circle cx="85" cy="65" r="14" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <line x1="85" y1="79" x2="85" y2="125" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="85" cy="150" rx="18" ry="22" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="85" y1="100" x2="105" y2="100" stroke={C.black} strokeWidth="3"/>
        <line x1="85" y1="172" x2="70" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="85" y1="172" x2="100" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="40" y1="75" x2="65" y2="79" stroke={C.black} strokeWidth="3"/>
        <polygon points="52,72 40,78 52,84" fill={C.black}/></svg>);
    case "wed-crunches":
      return (<svg {...common}><rect width="200" height="200" fill={C.yellow}/>
        <rect x="0" y="155" width="200" height="45" fill={C.black}/>
        <circle cx="100" cy="75" r="14" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="89" x2="100" y2="115" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="100" cy="135" rx="40" ry="18" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="153" x2="80" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="153" x2="120" y2="195" stroke={C.black} strokeWidth="3"/>
        <path d="M 85 115 Q 100 95 115 115" fill="none" stroke={C.black} strokeWidth="3"/>
        <text x="100" y="180" textAnchor="middle" fill={C.yellow} fontSize="32" fontWeight="800" fontFamily={fontFamily}>40</text></svg>);
    case "wed-pullups":
      return (<svg {...common}><rect width="200" height="200" fill={C.black}/>
        <rect x="35" y="18" width="130" height="14" rx="7" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="32" x2="100" y2="55" stroke={C.yellow} strokeWidth="3"/>
        <circle cx="100" cy="75" r="14" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="89" x2="100" y2="130" stroke={C.yellow} strokeWidth="3"/>
        <ellipse cx="100" cy="155" rx="18" ry="18" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="32" x2="75" y2="18" stroke={C.yellow} strokeWidth="3"/>
        <line x1="100" y1="32" x2="125" y2="18" stroke={C.yellow} strokeWidth="3"/>
        <line x1="100" y1="130" x2="82" y2="185" stroke={C.yellow} strokeWidth="3"/>
        <line x1="100" y1="130" x2="118" y2="185" stroke={C.yellow} strokeWidth="3"/>
        <polygon points="92,55 100,40 108,55" fill={C.black}/></svg>);
    case "wed-pushups":
      return (<svg {...common}><rect width="200" height="200" fill={C.green}/>
        <rect x="0" y="155" width="200" height="45" fill={C.yellow}/>
        <circle cx="100" cy="95" r="14" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="109" x2="100" y2="135" stroke={C.black} strokeWidth="3"/>
        <rect x="80" y="135" width="40" height="10" rx="4" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="40" y1="135" x2="100" y2="135" stroke={C.black} strokeWidth="3"/>
        <line x1="160" y1="135" x2="100" y2="135" stroke={C.black} strokeWidth="3"/>
        <line x1="40" y1="135" x2="35" y2="155" stroke={C.black} strokeWidth="3"/>
        <line x1="40" y1="145" x2="35" y2="155" stroke={C.black} strokeWidth="3"/>
        <line x1="160" y1="135" x2="165" y2="155" stroke={C.black} strokeWidth="3"/>
        <line x1="160" y1="145" x2="165" y2="155" stroke={C.black} strokeWidth="3"/></svg>);
    default:
      return (<svg {...common}><rect width="200" height="200" fill={C.teal}/><circle cx="100" cy="100" r="50" fill={C.yellow} stroke={C.black} strokeWidth="3"/></svg>);
  }
}

export default function WednesdayWorkoutPage() {
  return (
    <WorkoutPage
      exercises={EXERCISES}
      sections={SECTIONS}
      sectionNames={SECTION_NAMES}
      storageKey={STORAGE_KEY}
      heights={HEIGHTS}
      art={ExerciseSVG}
      title="Wednesday"
      subtitle="Norwegian 4×4 + Upper B · Week 2"
    />
  );
}
