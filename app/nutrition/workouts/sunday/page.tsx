"use client";

import WorkoutPage, { C, fontFamily, type Exercise } from "@/components/nutrition/WorkoutPage";

const STORAGE_KEY = "optimism-pop-sunday-v1";
const HEIGHTS = [220, 270, 200, 250, 230, 280, 210, 260, 240, 290, 195, 310];

const EXERCISES: Exercise[] = [
  /* ── Pre-Run Activation ── */
  { id: "sun-dorsiflexion", name: "Dorsiflexion Rocks", section: "pre-run", sectionLabel: "Activation", sets: 1, detail: "10 per side", tip: "Knee to wall — drive knee over toes, heel stays down" },
  { id: "sun-ankle-circles", name: "Ankle Circles", section: "pre-run", sectionLabel: "Activation", sets: 1, detail: "10 each direction per side" },
  { id: "sun-eversion-hold", name: "Eversion Isometric", section: "pre-run", sectionLabel: "Activation", sets: 2, detail: "15 sec hold", tip: "Press outside of foot against wall — targets peroneals" },
  { id: "sun-short-foot", name: "Short Foot Holds", section: "pre-run", sectionLabel: "Activation", sets: 2, detail: "10 sec each side", tip: "Press big toe, little toe, and heel into the ground, then lightly lift your arch by pulling the ball of your foot toward your heel WITHOUT curling your toes." },
  { id: "sun-hip-flexor-march", name: "Hip Flexor March Hold", section: "pre-run", sectionLabel: "Activation", sets: 2, detail: "10 sec each side", tip: "Knee to hip height, pelvis stays level" },
  { id: "sun-adduction-raises", name: "Side Lying Adduction", section: "pre-run", sectionLabel: "Activation", sets: 1, detail: "8 each side", tip: "Top leg crossed over, lift bottom leg with control" },
  { id: "sun-sl-balance", name: "Single Leg Balance", section: "pre-run", sectionLabel: "Activation", sets: 2, detail: "20 sec each side" },
  { id: "sun-sl-rdl-reach", name: "SL RDL Reach", section: "pre-run", sectionLabel: "Activation", sets: 1, detail: "5 each side, slow", tip: "Bodyweight only — hinge at hips, reach forward" },
  /* ── Run ── */
  { id: "sun-10mi-run", name: "10 Mile Run", section: "run", sectionLabel: "Run", sets: 1, detail: "Zone 2 · Start mile 1 at Zone 1", tip: "First mile Zone 1 easy. Then diligently stay in Zone 2 for the remaining 9 miles. Conversation pace." },
  /* ── Recovery ── */
  { id: "sun-walk", name: "Cooldown Walk", section: "recovery", sectionLabel: "Recovery", sets: 1, detail: "3–5 min" },
  { id: "sun-foam-roll", name: "Foam Roll", section: "recovery", sectionLabel: "Recovery", sets: 1, detail: "Quads · Calves · Glutes · IT Band", tip: "Spend 45–60 seconds per area. Roll slowly, pause on tender spots." },
  { id: "sun-static-stretch", name: "Static Stretch", section: "recovery", sectionLabel: "Recovery", sets: 1, detail: "Hip Flexor · Calf · Adductor", tip: "Hold each stretch 30–45 seconds. Breathe and relax into it." },
];

const SECTIONS = ["pre-run", "run", "recovery"];
const SECTION_NAMES: Record<string, string> = { "pre-run": "Activation", run: "Run", recovery: "Recovery" };

function ExerciseSVG({ id }: { id: string }) {
  const s = `0 0 200 200`;
  const common = { xmlns: "http://www.w3.org/2000/svg", viewBox: s, width: "100%", height: "100%", preserveAspectRatio: "xMidYMid slice" as const };

  switch (id) {
    case "sun-dorsiflexion":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.orange} />
          <rect x="120" y="0" width="80" height="200" fill={C.black} />
          <rect x="120" y="140" width="80" height="60" fill={C.white} stroke={C.black} strokeWidth="3" />
          <ellipse cx="70" cy="165" rx="35" ry="18" fill={C.yellow} stroke={C.black} strokeWidth="3" />
          <line x1="70" y1="147" x2="70" y2="100" stroke={C.black} strokeWidth="3" />
          <line x1="70" y1="100" x2="70" y2="55" stroke={C.black} strokeWidth="3" />
          <line x1="70" y1="55" x2="95" y2="75" stroke={C.black} strokeWidth="3" />
          <polygon points="88,70 95,75 88,80" fill={C.black} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "sun-ankle-circles":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.teal} />
          <ellipse cx="100" cy="130" rx="45" ry="25" fill={C.yellow} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="105" x2="100" y2="75" stroke={C.black} strokeWidth="3" />
          <path d="M 75 100 A 25 25 0 1 1 125 100" fill="none" stroke={C.black} strokeWidth="3" />
          <polygon points="118,95 125,100 118,105" fill={C.black} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "sun-eversion-hold":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.red} />
          <rect x="150" y="0" width="50" height="200" fill={C.black} />
          <ellipse cx="85" cy="110" rx="40" ry="22" fill={C.white} stroke={C.black} strokeWidth="3" />
          <path d="M 45 110 L 85 110" stroke={C.black} strokeWidth="3" />
          <polygon points="78,105 85,110 78,115" fill={C.black} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "sun-short-foot":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.orange} />
          <ellipse cx="100" cy="155" rx="55" ry="22" fill={C.red} stroke={C.black} strokeWidth="3" />
          <ellipse cx="100" cy="135" rx="35" ry="12" fill={C.white} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="123" x2="100" y2="85" stroke={C.black} strokeWidth="3" />
          <polygon points="93,92 100,75 107,92" fill={C.black} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "sun-hip-flexor-march":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.blue} />
          <circle cx="100" cy="45" r="18" fill={C.red} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="63" x2="100" y2="95" stroke={C.black} strokeWidth="3" />
          <rect x="88" y="95" width="24" height="55" fill={C.yellow} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="118" x2="75" y2="175" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="118" x2="100" y2="175" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="85" x2="65" y2="70" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="85" x2="135" y2="70" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="118" x2="135" y2="95" stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "sun-adduction-raises":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.blue} />
          <circle cx="140" cy="55" r="20" fill={C.orange} stroke={C.black} strokeWidth="3" />
          <line x1="140" y1="75" x2="140" y2="100" stroke={C.black} strokeWidth="3" />
          <rect x="125" y="100" width="30" height="45" fill={C.yellow} stroke={C.black} strokeWidth="3" />
          <line x1="140" y1="145" x2="115" y2="185" stroke={C.black} strokeWidth="3" />
          <line x1="140" y1="145" x2="165" y2="185" stroke={C.black} strokeWidth="3" />
          <line x1="115" y1="185" x2="165" y2="185" stroke={C.black} strokeWidth="3" />
          <line x1="50" y1="185" x2="50" y2="140" stroke={C.black} strokeWidth="3" />
          <polygon points="43,135 50,125 57,135" fill={C.black} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "sun-sl-balance":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.orange} />
          <circle cx="100" cy="45" r="20" fill={C.red} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="65" x2="100" y2="95" stroke={C.black} strokeWidth="3" />
          <rect x="88" y="95" width="24" height="35" fill={C.white} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="85" x2="65" y2="75" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="85" x2="135" y2="75" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="130" x2="100" y2="175" stroke={C.black} strokeWidth="3" />
          <circle cx="100" cy="175" r="12" fill={C.teal} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "sun-sl-rdl-reach":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.yellow} />
          <circle cx="100" cy="50" r="18" fill={C.orange} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="68" x2="100" y2="100" stroke={C.black} strokeWidth="3" />
          <rect x="88" y="100" width="24" height="40" fill={C.white} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="90" x2="70" y2="80" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="90" x2="130" y2="80" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="140" x2="100" y2="175" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="175" x2="55" y2="195" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="90" x2="140" y2="50" stroke={C.black} strokeWidth="3" />
          <polygon points="133,45 140,50 133,55" fill={C.black} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "sun-10mi-run":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.orange} />
          <rect x="0" y="165" width="200" height="35" fill={C.black} />
          <circle cx="80" cy="50" r="16" fill={C.yellow} stroke={C.black} strokeWidth="3" />
          <line x1="80" y1="66" x2="80" y2="100" stroke={C.black} strokeWidth="3" />
          <rect x="70" y="100" width="20" height="35" fill={C.white} stroke={C.black} strokeWidth="3" />
          <line x1="80" y1="85" x2="55" y2="75" stroke={C.black} strokeWidth="3" />
          <line x1="80" y1="85" x2="105" y2="75" stroke={C.black} strokeWidth="3" />
          <line x1="80" y1="135" x2="65" y2="185" stroke={C.black} strokeWidth="3" />
          <line x1="80" y1="135" x2="95" y2="185" stroke={C.black} strokeWidth="3" />
          <line x1="80" y1="100" x2="95" y2="55" stroke={C.black} strokeWidth="3" />
          <rect x="130" y="75" width="45" height="35" rx="6" fill={C.yellow} stroke={C.black} strokeWidth="3" />
          <text x="152" y="98" textAnchor="middle" fill={C.black} fontSize="22" fontWeight="800" fontFamily={fontFamily}>10</text>
        </svg>
      );
    case "sun-walk":
      return (
        <svg {...common}>
          <rect width="200" height="120" fill={C.teal} stroke={C.black} strokeWidth="3" />
          <rect x="0" y="120" width="200" height="80" fill={C.yellow} stroke={C.black} strokeWidth="3" />
          <circle cx="155" cy="45" r="25" fill={C.yellow} stroke={C.black} strokeWidth="3" />
          <circle cx="100" cy="55" r="16" fill={C.red} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="71" x2="100" y2="100" stroke={C.black} strokeWidth="3" />
          <rect x="88" y="100" width="24" height="35" fill={C.white} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="90" x2="75" y2="85" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="90" x2="125" y2="85" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="135" x2="85" y2="175" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="135" x2="115" y2="175" stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "sun-foam-roll":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.green} />
          <rect x="20" y="95" width="160" height="28" rx="14" fill={C.white} stroke={C.black} strokeWidth="3" />
          <circle cx="100" cy="55" r="18" fill={C.red} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="73" x2="100" y2="95" stroke={C.black} strokeWidth="3" />
          <rect x="88" y="95" width="24" height="50" fill={C.yellow} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="85" x2="75" y2="80" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="85" x2="125" y2="80" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="145" x2="85" y2="185" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="145" x2="115" y2="185" stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "sun-static-stretch":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.blue} />
          <circle cx="100" cy="50" r="18" fill={C.orange} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="68" x2="100" y2="95" stroke={C.black} strokeWidth="3" />
          <rect x="88" y="95" width="24" height="45" fill={C.white} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="85" x2="70" y2="80" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="85" x2="130" y2="80" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="140" x2="65" y2="195" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="140" x2="135" y2="195" stroke={C.black} strokeWidth="3" />
        </svg>
      );
    default:
      return (<svg {...common}><rect width="200" height="200" fill={C.orange}/><circle cx="100" cy="100" r="50" fill={C.yellow} stroke={C.black} strokeWidth="3"/></svg>);
  }
}

export default function SundayWorkoutPage() {
  return (
    <WorkoutPage
      exercises={EXERCISES}
      sections={SECTIONS}
      sectionNames={SECTION_NAMES}
      storageKey={STORAGE_KEY}
      heights={HEIGHTS}
      art={ExerciseSVG}
      title="Sunday"
      subtitle="Long Run Day"
    />
  );
}
