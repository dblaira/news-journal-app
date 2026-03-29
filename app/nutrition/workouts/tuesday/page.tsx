"use client";

import WorkoutPage, { C, type Exercise } from "@/components/nutrition/WorkoutPage";

const HEIGHTS = [220, 270, 200, 250, 230, 280, 210, 260, 240, 290, 195, 310, 225, 245];
const STORAGE_KEY = "optimism-pop-tuesday-v2";

/* ───────────────────────── EXERCISE DATA ───────────────────────── */
const EXERCISES: Exercise[] = [
  /* ── Warm-Up ── */
  { id: "tue-band-hip-march", name: "Band Hip Flexion March", section: "warmup", sectionLabel: "Warm-Up", sets: 2, detail: "8 each side", tip: "Band around foot, drive knee up to hip height with control." },
  { id: "tue-short-foot", name: "Short Foot", section: "warmup", sectionLabel: "Warm-Up", sets: 2, detail: "10 sec each foot", tip: "Big toe, little toe, heel down. Lift arch WITHOUT curling toes." },
  { id: "tue-band-eversion-wu", name: "Band Ankle Eversion", section: "warmup", sectionLabel: "Warm-Up", sets: 2, detail: "15 each side", tip: "Press outside of foot against band — targets peroneals for lateral ankle stability." },
  { id: "tue-adductor-squeeze-wu", name: "Adductor Squeeze", section: "warmup", sectionLabel: "Warm-Up", sets: 2, detail: "20 sec hold", tip: "Pillow or ball between knees, squeeze and hold. Protects left hip/groin." },
  /* ── Main Strength (Week 2: Progressive Overload) ── */
  { id: "tue-split-squat", name: "Split Squat", section: "main", sectionLabel: "Main Strength", sets: 4, detail: "10 each leg · controlled", tip: "Week 2: Added 1 set (3→4). Add 5–10 lbs from last week if form is solid. Every set within 3 min gets harder." },
  { id: "tue-rdl", name: "RDL", section: "main", sectionLabel: "Main Strength", sets: 3, detail: "12 reps · DB or BB", tip: "Week 2: Added 2 reps per set (10→12). Add 5–10 lbs if last week felt controlled. Hinge at hips, bar stays close." },
  { id: "tue-cable-rotation", name: "Cable Transverse Rotation", section: "main", sectionLabel: "Main Strength", sets: 3, detail: "14 each side", tip: "Week 2: Added 2 reps per set (12→14). Bump cable weight 5 lbs if 12 felt easy. Hips stay square — all rotation is thoracic." },
  { id: "tue-kb-squat", name: "Wide-Knees KB Squat", section: "main", sectionLabel: "Main Strength", sets: 4, detail: "12 reps · deadlift style", tip: "Week 2: Added 1 set (3→4). Go heavier on the KB if last week's weight was manageable. Drive up through heels." },
  { id: "tue-lateral-band", name: "Lateral Band Abduction", section: "main", sectionLabel: "Main Strength", sets: 3, detail: "14 each side", tip: "Week 2: Added 2 reps (12→14). Use a heavier band if available. Stay low in quarter squat, step sideways with control." },
  { id: "tue-hanging-knees", name: "Hanging Knees to Chest", section: "main", sectionLabel: "Main Strength", sets: 3, detail: "10 reps", tip: "Week 2: Added 2 reps (8→10). Controlled, no swinging. If 10 is tough, slow the tempo instead." },
  /* ── Accessories & Correctives ── */
  { id: "tue-calf-raises", name: "Calf Raises (slow)", section: "accessories", sectionLabel: "Accessories", sets: 3, detail: "15 reps", tip: "Slow on the way up AND down. Full range — drop heel below step." },
  { id: "tue-band-eversion-acc", name: "Band Ankle Eversion", section: "accessories", sectionLabel: "Accessories", sets: 3, detail: "20 each side", tip: "Higher reps to build endurance in peroneals. Slow and controlled." },
  { id: "tue-band-hip-march-acc", name: "Band Hip Flexion March", section: "accessories", sectionLabel: "Accessories", sets: 3, detail: "12 each side" },
  { id: "tue-adductor-squeeze-acc", name: "Adductor Squeeze", section: "accessories", sectionLabel: "Accessories", sets: 2, detail: "20 sec hold" },
];

const SECTIONS = ["warmup", "main", "accessories"];
const SECTION_NAMES: Record<string, string> = { warmup: "Warm-Up", main: "Main Strength", accessories: "Accessories" };

/* ───────────────────────── SVG ART ───────────────────────── */
function ExerciseSVG({ id }: { id: string }) {
  const s = `0 0 200 200`;
  const common = { xmlns: "http://www.w3.org/2000/svg", viewBox: s, width: "100%", height: "100%", preserveAspectRatio: "xMidYMid slice" as const };

  switch (id) {
    case "tue-band-hip-march":
      return (<svg {...common}><rect width="200" height="200" fill={C.red}/>
        <circle cx="100" cy="45" r="14" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="59" x2="100" y2="95" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="100" cy="120" rx="22" ry="25" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="145" x2="75" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="145" x2="125" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="75" y1="95" x2="75" y2="120" stroke={C.black} strokeWidth="3"/>
        <line x1="125" y1="95" x2="125" y2="85" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="125" cy="70" rx="12" ry="18" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <ellipse cx="75" cy="195" rx="14" ry="8" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <path d="M 75 85 Q 95 65 125 70" fill="none" stroke={C.orange} strokeWidth="3"/>
        <polygon points="115,72 105,78 110,88" fill={C.black}/></svg>);
    case "tue-short-foot":
      return (<svg {...common}><rect width="200" height="200" fill={C.red}/>
        <ellipse cx="100" cy="130" rx="55" ry="25" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <path d="M 55 145 Q 100 155 145 145" fill="none" stroke={C.black} strokeWidth="3"/>
        <circle cx="75" cy="150" r="8" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <circle cx="100" cy="152" r="8" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <circle cx="125" cy="150" r="8" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <path d="M 100 105 Q 100 85 100 65" fill="none" stroke={C.black} strokeWidth="3"/>
        <polygon points="94,72 100,55 106,72" fill={C.black}/></svg>);
    case "tue-band-eversion-wu":
      return (<svg {...common}><rect width="200" height="200" fill={C.orange}/>
        <rect x="155" y="0" width="45" height="200" fill={C.black}/>
        <ellipse cx="85" cy="110" rx="45" ry="30" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <path d="M 55 110 Q 85 95 115 110" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <line x1="115" y1="110" x2="155" y2="110" stroke={C.red} strokeWidth="3"/>
        <polygon points="148,105 160,110 148,115" fill={C.black}/></svg>);
    case "tue-adductor-squeeze-wu":
      return (<svg {...common}><rect width="200" height="200" fill={C.teal}/>
        <circle cx="75" cy="100" r="35" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <circle cx="125" cy="100" r="35" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <rect x="88" y="70" width="24" height="60" rx="12" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <polygon points="92,85 100,65 108,85" fill={C.black}/>
        <polygon points="92,115 100,135 108,115" fill={C.black}/></svg>);
    case "tue-split-squat":
      return (<svg {...common}><rect width="200" height="200" fill={C.blue}/>
        <rect x="0" y="172" width="200" height="28" fill={C.black}/>
        <circle cx="100" cy="45" r="14" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="59" x2="100" y2="100" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="100" cy="118" rx="18" ry="22" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="85" y1="100" x2="70" y2="95" stroke={C.black} strokeWidth="3"/>
        <line x1="115" y1="100" x2="130" y2="95" stroke={C.black} strokeWidth="3"/>
        <line x1="85" y1="140" x2="75" y2="172" stroke={C.black} strokeWidth="3"/>
        <line x1="115" y1="140" x2="125" y2="145" stroke={C.black} strokeWidth="3"/>
        <line x1="125" y1="145" x2="135" y2="172" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="75" cy="185" rx="12" ry="8" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <ellipse cx="135" cy="178" rx="10" ry="6" fill={C.red} stroke={C.black} strokeWidth="3"/></svg>);
    case "tue-rdl":
      return (<svg {...common}><rect width="200" height="200" fill={C.yellow}/>
        <rect x="0" y="172" width="200" height="28" fill={C.black}/>
        <rect x="35" y="95" width="130" height="12" rx="6" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <circle cx="100" cy="55" r="14" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="69" x2="100" y2="95" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="100" cy="115" rx="20" ry="25" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="140" x2="80" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="140" x2="120" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="70" y1="95" x2="45" y2="100" stroke={C.black} strokeWidth="3"/>
        <line x1="130" y1="95" x2="155" y2="100" stroke={C.black} strokeWidth="3"/>
        <polygon points="92,95 100,75 108,95" fill={C.black}/></svg>);
    case "tue-cable-rotation":
      return (<svg {...common}><rect width="200" height="200" fill={C.green}/>
        <rect x="165" y="0" width="35" height="200" fill={C.black}/>
        <line x1="165" y1="100" x2="110" y2="100" stroke={C.red} strokeWidth="3"/>
        <circle cx="85" cy="85" r="14" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <line x1="85" y1="99" x2="85" y2="135" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="85" cy="155" rx="18" ry="20" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="85" y1="100" x2="110" y2="100" stroke={C.black} strokeWidth="3"/>
        <line x1="85" y1="135" x2="70" y2="185" stroke={C.black} strokeWidth="3"/>
        <line x1="85" y1="135" x2="100" y2="185" stroke={C.black} strokeWidth="3"/>
        <path d="M 55 85 Q 35 100 55 115" fill="none" stroke={C.black} strokeWidth="3"/>
        <polygon points="50,110 60,115 50,120" fill={C.black}/></svg>);
    case "tue-kb-squat":
      return (<svg {...common}><rect width="200" height="200" fill={C.red}/>
        <rect x="0" y="165" width="200" height="35" fill={C.black}/>
        <circle cx="100" cy="50" r="14" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="64" x2="100" y2="95" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="100" cy="120" rx="35" ry="25" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="75" y1="95" x2="55" y2="125" stroke={C.black} strokeWidth="3"/>
        <line x1="125" y1="95" x2="145" y2="125" stroke={C.black} strokeWidth="3"/>
        <line x1="75" y1="145" x2="65" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="125" y1="145" x2="135" y2="195" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="88" cy="128" rx="14" ry="18" fill={C.orange} stroke={C.black} strokeWidth="3"/></svg>);
    case "tue-lateral-band":
      return (<svg {...common}><rect width="200" height="200" fill={C.orange}/>
        <rect x="0" y="165" width="200" height="35" fill={C.black}/>
        <circle cx="100" cy="55" r="14" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="69" x2="100" y2="115" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="100" cy="135" rx="25" ry="22" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="75" y1="115" x2="55" y2="140" stroke={C.black} strokeWidth="3"/>
        <line x1="125" y1="115" x2="155" y2="140" stroke={C.black} strokeWidth="3"/>
        <line x1="55" y1="140" x2="50" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="155" y1="140" x2="150" y2="195" stroke={C.black} strokeWidth="3"/>
        <path d="M 55 140 Q 85 140 115 140" fill="none" stroke={C.red} strokeWidth="3"/>
        <polygon points="150,135 165,140 150,145" fill={C.black}/></svg>);
    case "tue-hanging-knees":
      return (<svg {...common}><rect width="200" height="200" fill={C.black}/>
        <rect x="35" y="18" width="130" height="14" rx="7" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="32" x2="100" y2="58" stroke={C.yellow} strokeWidth="3"/>
        <circle cx="100" cy="75" r="14" fill={C.red} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="89" x2="100" y2="120" stroke={C.yellow} strokeWidth="3"/>
        <path d="M 100 120 Q 75 155 85 175" fill="none" stroke={C.yellow} strokeWidth="3"/>
        <path d="M 100 120 Q 125 155 115 175" fill="none" stroke={C.yellow} strokeWidth="3"/>
        <line x1="100" y1="58" x2="75" y2="32" stroke={C.yellow} strokeWidth="3"/>
        <line x1="100" y1="58" x2="125" y2="32" stroke={C.yellow} strokeWidth="3"/>
        <ellipse cx="100" cy="165" rx="18" ry="12" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <polygon points="92,155 100,140 108,155" fill={C.black}/></svg>);
    case "tue-calf-raises":
      return (<svg {...common}><rect width="200" height="200" fill={C.blue}/>
        <rect x="50" y="135" width="100" height="25" rx="6" fill={C.black}/>
        <circle cx="100" cy="55" r="14" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="69" x2="100" y2="110" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="100" cy="125" rx="18" ry="15" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="85" y1="110" x2="80" y2="135" stroke={C.black} strokeWidth="3"/>
        <line x1="115" y1="110" x2="120" y2="135" stroke={C.black} strokeWidth="3"/>
        <line x1="80" y1="135" x2="75" y2="160" stroke={C.black} strokeWidth="3"/>
        <line x1="120" y1="135" x2="125" y2="160" stroke={C.black} strokeWidth="3"/>
        <polygon points="72,155 80,135 88,155" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <polygon points="112,155 120,135 128,155" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <polygon points="92,130 100,115 108,130" fill={C.black}/></svg>);
    case "tue-band-eversion-acc":
      return (<svg {...common}><rect width="200" height="200" fill={C.teal}/>
        <rect x="0" y="0" width="45" height="200" fill={C.black}/>
        <ellipse cx="110" cy="110" rx="45" ry="30" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <path d="M 80 110 Q 110 95 140 110" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <line x1="45" y1="110" x2="95" y2="110" stroke={C.orange} strokeWidth="3"/>
        <polygon points="88,105 75,110 88,115" fill={C.black}/></svg>);
    case "tue-band-hip-march-acc":
      return (<svg {...common}><rect width="200" height="200" fill={C.green}/>
        <circle cx="100" cy="45" r="14" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="59" x2="100" y2="95" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="100" cy="120" rx="22" ry="25" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="145" x2="75" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="100" y1="145" x2="125" y2="195" stroke={C.black} strokeWidth="3"/>
        <line x1="75" y1="95" x2="75" y2="120" stroke={C.black} strokeWidth="3"/>
        <line x1="125" y1="95" x2="125" y2="85" stroke={C.black} strokeWidth="3"/>
        <ellipse cx="125" cy="70" rx="12" ry="18" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <ellipse cx="75" cy="195" rx="14" ry="8" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <path d="M 75 85 Q 95 65 125 70" fill="none" stroke={C.orange} strokeWidth="3"/>
        <polygon points="115,72 105,78 110,88" fill={C.black}/></svg>);
    case "tue-adductor-squeeze-acc":
      return (<svg {...common}><rect width="200" height="200" fill={C.blue}/>
        <circle cx="75" cy="100" r="35" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <circle cx="125" cy="100" r="35" fill={C.yellow} stroke={C.black} strokeWidth="3"/>
        <rect x="88" y="70" width="24" height="60" rx="12" fill={C.white} stroke={C.black} strokeWidth="3"/>
        <polygon points="92,85 100,65 108,85" fill={C.black}/>
        <polygon points="92,115 100,135 108,115" fill={C.black}/></svg>);
    default:
      return (<svg {...common}><rect width="200" height="200" fill={C.red}/><circle cx="100" cy="100" r="50" fill={C.yellow} stroke={C.black} strokeWidth="3"/></svg>);
  }
}

export default function TuesdayWorkoutPage() {
  return (
    <WorkoutPage
      exercises={EXERCISES}
      sections={SECTIONS}
      sectionNames={SECTION_NAMES}
      storageKey={STORAGE_KEY}
      heights={HEIGHTS}
      art={ExerciseSVG}
      title="Tuesday"
      subtitle="Lower Strength A · Week 2"
    />
  );
}
