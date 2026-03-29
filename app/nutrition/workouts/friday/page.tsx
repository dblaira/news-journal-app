"use client";

import WorkoutPage, { C, type Exercise } from "@/components/nutrition/WorkoutPage";

const STORAGE_KEY = "optimism-pop-friday-v1";
const HEIGHTS = [220,270,200,250,230,280,210,260,240,290,195,310,225,245,205,265,235,220,250,230];

/* ───────────────────────── EXERCISE DATA ───────────────────────── */
const EXERCISES: Exercise[] = [
  /* ── Warm-Up ── */
  { id: "fri-short-foot", name: "Short Foot Holds", section: "warmup", sectionLabel: "Warm-Up", sets: 2, detail: "10 sec each foot", tip: "Press big toe, little toe, and heel into the ground, then lightly lift your arch by pulling the ball of your foot toward your heel WITHOUT curling your toes." },
  { id: "fri-band-eversion", name: "Band Ankle Eversion", section: "warmup", sectionLabel: "Warm-Up", sets: 2, detail: "15 each side", tip: "Press outside of foot against resistance \u2014 targets peroneals for lateral ankle stability." },
  { id: "fri-adductor-squeeze", name: "Adductor Squeeze", section: "warmup", sectionLabel: "Warm-Up", sets: 2, detail: "20 sec hold" },
  { id: "fri-band-hip-march-wu", name: "Band Hip Flexion March", section: "warmup", sectionLabel: "Warm-Up", sets: 2, detail: "8 each side" },

  /* ── Main Work: Group 1 ── */
  { id: "fri-goblet-squat", name: "Goblet Squat", section: "main-1", sectionLabel: "Main \u2014 Group 1", sets: 3, detail: "12 reps \u00b7 slow tempo", tip: "Controlled descent, chest up, knees tracking over toes. 3 sec down, 1 sec pause at bottom. This is tissue capacity work, not max effort." },
  { id: "fri-sl-rdl", name: "Single-Leg RDL", section: "main-1", sectionLabel: "Main \u2014 Group 1", sets: 3, detail: "8 each side \u00b7 light", tip: "Hinge at hips, slight knee bend, feel the stretch in hamstrings. Keep weight close to your leg." },
  { id: "fri-pallof-press", name: "Pallof Press", section: "main-1", sectionLabel: "Main \u2014 Group 1", sets: 3, detail: "10 each side", tip: "Press hands straight out from chest, resist the cable pulling you into rotation. Keep hips square." },

  /* ── Main Work: Group 2 ── */
  { id: "fri-reverse-lunge", name: "Reverse Lunge to Balance", section: "main-2", sectionLabel: "Main \u2014 Group 2", sets: 3, detail: "8 each leg", tip: "Step back into lunge, then drive knee up and hold 2 seconds at top. Proprioceptive challenge that feeds running mechanics." },
  { id: "fri-lateral-band-walk-main", name: "Lateral Band Walks", section: "main-2", sectionLabel: "Main \u2014 Group 2", sets: 3, detail: "12 each side", tip: "Band around ankles or just above knees. Stay low in quarter squat, step sideways with control." },
  { id: "fri-side-plank-dip", name: "Side Plank Hip Dip", section: "main-2", sectionLabel: "Main \u2014 Group 2", sets: 2, detail: "10 each side", tip: "From side plank, lower hip toward floor and drive back up. Targets lateral hip stabilizers." },

  /* ── Correctives & Accessories ── */
  { id: "fri-band-eversion-corr", name: "Band Eversion", section: "correctives", sectionLabel: "Correctives", sets: 2, detail: "15\u201320 each side" },
  { id: "fri-calf-raises", name: "Calf Raises (slow)", section: "correctives", sectionLabel: "Correctives", sets: 3, detail: "12\u201315 reps", tip: "Go slow on the way up AND down. Full range of motion \u2014 drop the heel below the step." },
  { id: "fri-tib-raises", name: "Tibialis Raises", section: "correctives", sectionLabel: "Correctives", sets: 3, detail: "15\u201320 reps", tip: "Lean back against wall, heels 6\u20138 inches from baseboard. Lift the balls of your feet toward your shins. Slow and controlled." },
  { id: "fri-sl-balance", name: "Single Leg Balance", section: "correctives", sectionLabel: "Correctives", sets: 2, detail: "20\u201330 sec each" },
  { id: "fri-band-hip-march-corr", name: "Band Hip Flexion March", section: "correctives", sectionLabel: "Correctives", sets: 2, detail: "8\u201312 each side" },
  { id: "fri-adduction-raises", name: "Side Lying Adduction", section: "correctives", sectionLabel: "Correctives", sets: 2, detail: "10\u201315 each side", tip: "Top leg crossed over, lift bottom leg with control." },
  { id: "fri-lateral-band-walk-corr", name: "Lateral Band Walk", section: "correctives", sectionLabel: "Correctives", sets: 2, detail: "10\u201315 steps each way" },
];

const SECTIONS = ["warmup", "main-1", "main-2", "correctives"];
const SECTION_NAMES: Record<string, string> = { warmup: "Warm-Up", "main-1": "Group 1", "main-2": "Group 2", correctives: "Correctives" };

/* ───────────────────────── SVG ART ───────────────────────── */
function ExerciseSVG({ id }: { id: string }) {
  const s = `0 0 200 200`;
  const common = { xmlns: "http://www.w3.org/2000/svg", viewBox: s, width: "100%", height: "100%", preserveAspectRatio: "xMidYMid slice" as const };

  switch (id) {
    case "fri-short-foot":
      return (<svg {...common}><rect width="200" height="200" fill={C.blue} /><ellipse cx="100" cy="155" rx="55" ry="22" fill={C.red} stroke={C.black} strokeWidth="3" /><ellipse cx="100" cy="135" rx="35" ry="12" fill={C.white} stroke={C.black} strokeWidth="3" /><line x1="100" y1="123" x2="100" y2="85" stroke={C.black} strokeWidth="3" /><polygon points="93,92 100,75 107,92" fill={C.black} stroke={C.black} strokeWidth="3" /></svg>);
    case "fri-band-eversion":
      return (<svg {...common}><rect width="200" height="200" fill={C.orange} /><ellipse cx="85" cy="110" rx="40" ry="22" fill={C.white} stroke={C.black} strokeWidth="3" /><rect x="140" y="70" width="50" height="80" fill={C.black} /><path d="M 45 110 L 85 110" stroke={C.black} strokeWidth="3" /><polygon points="78,105 85,110 78,115" fill={C.black} stroke={C.black} strokeWidth="3" /></svg>);
    case "fri-adductor-squeeze":
      return (<svg {...common}><rect width="200" height="200" fill={C.teal} /><circle cx="100" cy="110" r="35" fill={C.yellow} stroke={C.black} strokeWidth="3" /><rect x="88" y="75" width="24" height="70" fill={C.red} stroke={C.black} strokeWidth="3" /><line x1="100" y1="145" x2="75" y2="185" stroke={C.black} strokeWidth="3" /><line x1="100" y1="145" x2="125" y2="185" stroke={C.black} strokeWidth="3" /><line x1="75" y1="185" x2="125" y2="185" stroke={C.black} strokeWidth="3" /></svg>);
    case "fri-band-hip-march-wu":
      return (<svg {...common}><rect width="200" height="200" fill={C.blue} /><circle cx="100" cy="45" r="18" fill={C.red} stroke={C.black} strokeWidth="3" /><line x1="100" y1="63" x2="100" y2="95" stroke={C.black} strokeWidth="3" /><rect x="88" y="95" width="24" height="55" fill={C.yellow} stroke={C.black} strokeWidth="3" /><line x1="100" y1="118" x2="75" y2="175" stroke={C.black} strokeWidth="3" /><line x1="100" y1="118" x2="100" y2="175" stroke={C.black} strokeWidth="3" /><line x1="100" y1="85" x2="65" y2="70" stroke={C.black} strokeWidth="3" /><line x1="100" y1="85" x2="135" y2="70" stroke={C.black} strokeWidth="3" /><line x1="100" y1="118" x2="135" y2="95" stroke={C.black} strokeWidth="3" /><rect x="50" y="85" width="30" height="8" rx="4" fill={C.white} stroke={C.black} strokeWidth="3" /></svg>);
    case "fri-goblet-squat":
      return (<svg {...common}><rect width="200" height="200" fill={C.red} /><circle cx="100" cy="45" r="18" fill={C.yellow} stroke={C.black} strokeWidth="3" /><line x1="100" y1="63" x2="100" y2="95" stroke={C.black} strokeWidth="3" /><rect x="88" y="95" width="24" height="55" fill={C.white} stroke={C.black} strokeWidth="3" /><line x1="100" y1="85" x2="70" y2="80" stroke={C.black} strokeWidth="3" /><line x1="100" y1="85" x2="130" y2="80" stroke={C.black} strokeWidth="3" /><ellipse cx="85" cy="165" rx="18" ry="12" fill={C.yellow} stroke={C.black} strokeWidth="3" /><ellipse cx="115" cy="165" rx="18" ry="12" fill={C.yellow} stroke={C.black} strokeWidth="3" /><rect x="85" y="25" width="30" height="25" rx="4" fill={C.orange} stroke={C.black} strokeWidth="3" /></svg>);
    case "fri-sl-rdl":
      return (<svg {...common}><rect width="200" height="200" fill={C.yellow} /><circle cx="100" cy="50" r="18" fill={C.red} stroke={C.black} strokeWidth="3" /><line x1="100" y1="68" x2="100" y2="100" stroke={C.black} strokeWidth="3" /><rect x="88" y="100" width="24" height="40" fill={C.white} stroke={C.black} strokeWidth="3" /><line x1="100" y1="90" x2="70" y2="80" stroke={C.black} strokeWidth="3" /><line x1="100" y1="90" x2="130" y2="80" stroke={C.black} strokeWidth="3" /><line x1="100" y1="140" x2="100" y2="175" stroke={C.black} strokeWidth="3" /><line x1="100" y1="175" x2="55" y2="195" stroke={C.black} strokeWidth="3" /><rect x="95" y="155" width="20" height="25" rx="4" fill={C.blue} stroke={C.black} strokeWidth="3" /></svg>);
    case "fri-pallof-press":
      return (<svg {...common}><rect width="200" height="200" fill={C.blue} /><rect x="150" y="0" width="50" height="200" fill={C.black} /><line x1="150" y1="100" x2="100" y2="100" stroke={C.yellow} strokeWidth="6" /><circle cx="100" cy="70" r="18" fill={C.red} stroke={C.black} strokeWidth="3" /><line x1="100" y1="88" x2="100" y2="115" stroke={C.black} strokeWidth="3" /><rect x="88" y="115" width="24" height="45" fill={C.white} stroke={C.black} strokeWidth="3" /><line x1="100" y1="105" x2="75" y2="100" stroke={C.black} strokeWidth="3" /><line x1="100" y1="105" x2="125" y2="100" stroke={C.black} strokeWidth="3" /><line x1="100" y1="160" x2="85" y2="190" stroke={C.black} strokeWidth="3" /><line x1="100" y1="160" x2="115" y2="190" stroke={C.black} strokeWidth="3" /><polygon points="93,95 100,85 107,95" fill={C.black} stroke={C.black} strokeWidth="3" /></svg>);
    case "fri-reverse-lunge":
      return (<svg {...common}><rect width="200" height="200" fill={C.green} /><rect x="0" y="175" width="200" height="25" fill={C.black} /><circle cx="100" cy="45" r="18" fill={C.yellow} stroke={C.black} strokeWidth="3" /><line x1="100" y1="63" x2="100" y2="100" stroke={C.black} strokeWidth="3" /><rect x="88" y="100" width="24" height="40" fill={C.white} stroke={C.black} strokeWidth="3" /><line x1="100" y1="90" x2="70" y2="85" stroke={C.black} strokeWidth="3" /><line x1="100" y1="90" x2="130" y2="85" stroke={C.black} strokeWidth="3" /><line x1="100" y1="140" x2="75" y2="175" stroke={C.black} strokeWidth="3" /><line x1="100" y1="140" x2="130" y2="165" stroke={C.black} strokeWidth="3" /><line x1="100" y1="100" x2="130" y2="75" stroke={C.black} strokeWidth="3" /><polygon points="125,70 130,75 125,80" fill={C.black} stroke={C.black} strokeWidth="3" /></svg>);
    case "fri-lateral-band-walk-main":
      return (<svg {...common}><rect width="200" height="200" fill={C.orange} /><rect x="0" y="165" width="200" height="35" fill={C.black} /><line x1="40" y1="120" x2="160" y2="120" stroke={C.yellow} strokeWidth="6" /><circle cx="100" cy="55" r="18" fill={C.red} stroke={C.black} strokeWidth="3" /><line x1="100" y1="73" x2="100" y2="100" stroke={C.black} strokeWidth="3" /><rect x="88" y="100" width="24" height="40" fill={C.white} stroke={C.black} strokeWidth="3" /><line x1="100" y1="90" x2="65" y2="85" stroke={C.black} strokeWidth="3" /><line x1="100" y1="90" x2="135" y2="85" stroke={C.black} strokeWidth="3" /><line x1="100" y1="140" x2="70" y2="185" stroke={C.black} strokeWidth="3" /><line x1="100" y1="140" x2="130" y2="185" stroke={C.black} strokeWidth="3" /><polygon points="155,115 165,120 155,125" fill={C.black} stroke={C.black} strokeWidth="3" /></svg>);
    case "fri-side-plank-dip":
      return (<svg {...common}><rect width="200" height="200" fill={C.blue} /><rect x="0" y="160" width="200" height="40" fill={C.yellow} stroke={C.black} strokeWidth="3" /><line x1="50" y1="160" x2="140" y2="110" stroke={C.black} strokeWidth="3" /><circle cx="50" cy="160" r="12" fill={C.red} stroke={C.black} strokeWidth="3" /><circle cx="140" cy="110" r="14" fill={C.red} stroke={C.black} strokeWidth="3" /><line x1="95" y1="135" x2="95" y2="155" stroke={C.black} strokeWidth="3" /><polygon points="90,150 95,162 100,150" fill={C.black} stroke={C.black} strokeWidth="3" /></svg>);
    case "fri-band-eversion-corr":
      return (<svg {...common}><rect width="200" height="200" fill={C.teal} /><ellipse cx="95" cy="110" rx="40" ry="22" fill={C.white} stroke={C.black} strokeWidth="3" /><rect x="0" y="70" width="50" height="80" fill={C.black} /><path d="M 135 110 L 95 110" stroke={C.black} strokeWidth="3" /><polygon points="102,105 95,110 102,115" fill={C.black} stroke={C.black} strokeWidth="3" /></svg>);
    case "fri-calf-raises":
      return (<svg {...common}><rect width="200" height="200" fill={C.red} /><rect x="50" y="130" width="100" height="25" fill={C.black} /><rect x="70" y="50" width="25" height="80" fill={C.white} stroke={C.black} strokeWidth="3" /><rect x="105" y="50" width="25" height="80" fill={C.white} stroke={C.black} strokeWidth="3" /><circle cx="100" cy="45" r="18" fill={C.yellow} stroke={C.black} strokeWidth="3" /><line x1="100" y1="130" x2="100" y2="175" stroke={C.black} strokeWidth="3" /><polygon points="93,168 100,155 107,168" fill={C.black} stroke={C.black} strokeWidth="3" /></svg>);
    case "fri-tib-raises":
      return (<svg {...common}><rect width="200" height="200" fill={C.yellow} /><rect x="130" y="0" width="50" height="200" fill={C.black} /><circle cx="75" cy="55" r="18" fill={C.red} stroke={C.black} strokeWidth="3" /><line x1="75" y1="73" x2="75" y2="120" stroke={C.black} strokeWidth="3" /><rect x="63" y="120" width="24" height="45" fill={C.white} stroke={C.black} strokeWidth="3" /><line x1="75" y1="165" x2="50" y2="195" stroke={C.black} strokeWidth="3" /><line x1="75" y1="165" x2="100" y2="195" stroke={C.black} strokeWidth="3" /><ellipse cx="75" cy="195" rx="28" ry="10" fill={C.orange} stroke={C.black} strokeWidth="3" /><polygon points="68,108 75,98 82,108" fill={C.black} stroke={C.black} strokeWidth="3" /></svg>);
    case "fri-sl-balance":
      return (<svg {...common}><rect width="200" height="200" fill={C.blue} /><circle cx="100" cy="45" r="20" fill={C.red} stroke={C.black} strokeWidth="3" /><line x1="100" y1="65" x2="100" y2="95" stroke={C.black} strokeWidth="3" /><rect x="88" y="95" width="24" height="35" fill={C.white} stroke={C.black} strokeWidth="3" /><line x1="100" y1="85" x2="65" y2="75" stroke={C.black} strokeWidth="3" /><line x1="100" y1="85" x2="135" y2="75" stroke={C.black} strokeWidth="3" /><line x1="100" y1="130" x2="100" y2="175" stroke={C.black} strokeWidth="3" /><circle cx="100" cy="175" r="12" fill={C.orange} stroke={C.black} strokeWidth="3" /></svg>);
    case "fri-band-hip-march-corr":
      return (<svg {...common}><rect width="200" height="200" fill={C.green} /><circle cx="100" cy="45" r="18" fill={C.red} stroke={C.black} strokeWidth="3" /><line x1="100" y1="63" x2="100" y2="95" stroke={C.black} strokeWidth="3" /><rect x="88" y="95" width="24" height="55" fill={C.yellow} stroke={C.black} strokeWidth="3" /><line x1="100" y1="118" x2="75" y2="175" stroke={C.black} strokeWidth="3" /><line x1="100" y1="118" x2="100" y2="175" stroke={C.black} strokeWidth="3" /><line x1="100" y1="85" x2="65" y2="70" stroke={C.black} strokeWidth="3" /><line x1="100" y1="85" x2="135" y2="70" stroke={C.black} strokeWidth="3" /><line x1="100" y1="118" x2="135" y2="95" stroke={C.black} strokeWidth="3" /><rect x="50" y="85" width="30" height="8" rx="4" fill={C.teal} stroke={C.black} strokeWidth="3" /></svg>);
    case "fri-adduction-raises":
      return (<svg {...common}><rect width="200" height="200" fill={C.orange} /><circle cx="140" cy="55" r="20" fill={C.yellow} stroke={C.black} strokeWidth="3" /><line x1="140" y1="75" x2="140" y2="100" stroke={C.black} strokeWidth="3" /><rect x="125" y="100" width="30" height="45" fill={C.red} stroke={C.black} strokeWidth="3" /><line x1="140" y1="145" x2="115" y2="185" stroke={C.black} strokeWidth="3" /><line x1="140" y1="145" x2="165" y2="185" stroke={C.black} strokeWidth="3" /><line x1="115" y1="185" x2="165" y2="185" stroke={C.black} strokeWidth="3" /><line x1="50" y1="185" x2="50" y2="140" stroke={C.black} strokeWidth="3" /><polygon points="43,135 50,125 57,135" fill={C.black} stroke={C.black} strokeWidth="3" /></svg>);
    case "fri-lateral-band-walk-corr":
      return (<svg {...common}><rect width="200" height="200" fill={C.yellow} /><rect x="0" y="165" width="200" height="35" fill={C.black} /><line x1="35" y1="120" x2="165" y2="120" stroke={C.red} strokeWidth="6" /><circle cx="100" cy="55" r="18" fill={C.blue} stroke={C.black} strokeWidth="3" /><line x1="100" y1="73" x2="100" y2="100" stroke={C.black} strokeWidth="3" /><rect x="88" y="100" width="24" height="40" fill={C.white} stroke={C.black} strokeWidth="3" /><line x1="100" y1="90" x2="65" y2="85" stroke={C.black} strokeWidth="3" /><line x1="100" y1="90" x2="135" y2="85" stroke={C.black} strokeWidth="3" /><line x1="100" y1="140" x2="70" y2="185" stroke={C.black} strokeWidth="3" /><line x1="100" y1="140" x2="130" y2="185" stroke={C.black} strokeWidth="3" /><polygon points="155,115 165,120 155,125" fill={C.black} stroke={C.black} strokeWidth="3" /></svg>);
    default:
      return (<svg {...common}><rect width="200" height="200" fill={C.blue} /><circle cx="100" cy="100" r="50" fill={C.yellow} stroke={C.black} strokeWidth="3" /></svg>);
  }
}

/* ───────────────────────── PAGE ───────────────────────── */
export default function FridayWorkoutPage() {
  return (
    <WorkoutPage
      exercises={EXERCISES}
      sections={SECTIONS}
      sectionNames={SECTION_NAMES}
      storageKey={STORAGE_KEY}
      heights={HEIGHTS}
      art={ExerciseSVG}
      title="Friday"
      subtitle="Lower Strength B"
    />
  );
}
