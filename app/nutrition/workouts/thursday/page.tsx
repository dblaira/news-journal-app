"use client";

import WorkoutPage, { C, type Exercise } from "@/components/nutrition/WorkoutPage";

const STORAGE_KEY = "optimism-pop-v1";
const HEIGHTS = [220, 270, 200, 250, 230, 280, 210, 260, 240, 290, 195, 310, 225, 245, 205, 265, 235];

const EXERCISES: Exercise[] = [
  { id: "wall-dorsiflexion", name: "Wall Dorsiflexion", section: "pre-run", sectionLabel: "Activation", sets: 1, detail: "10 per side", tip: "Drive knee over toes toward wall, heel stays down" },
  { id: "ankle-circles", name: "Ankle Circles", section: "pre-run", sectionLabel: "Activation", sets: 1, detail: "10 each direction" },
  { id: "eversion-hold", name: "Eversion Hold", section: "pre-run", sectionLabel: "Activation", sets: 2, detail: "15 sec hold", tip: "Press outside of foot against wall — targets peroneals" },
  { id: "short-foot", name: "Short Foot", section: "pre-run", sectionLabel: "Activation", sets: 2, detail: "10 sec each side", tip: "Big toe, little toe, heel down. Lift arch WITHOUT curling toes" },
  { id: "hip-flexor-march", name: "Hip Flexor March", section: "pre-run", sectionLabel: "Activation", sets: 2, detail: "10 sec hold", tip: "Knee to hip height, pelvis level" },
  { id: "adduction-raises", name: "Adduction Raises", section: "pre-run", sectionLabel: "Activation", sets: 1, detail: "8 each side", tip: "Top leg crossed over, lift bottom leg" },
  { id: "sl-balance", name: "SL Balance", section: "pre-run", sectionLabel: "Activation", sets: 2, detail: "20 sec each" },
  { id: "sl-rdl-reach", name: "SL RDL Reach", section: "pre-run", sectionLabel: "Activation", sets: 1, detail: "5 each, slow" },
  { id: "a-skip", name: "A Skip", section: "drills", sectionLabel: "Drills", sets: 2, detail: "2 × 20m", tip: "Easy rhythm. Knee up, quick hop. Relaxed" },
  { id: "b-skip", name: "B Skip", section: "drills", sectionLabel: "Drills", sets: 2, detail: "2 × 20m", tip: "Smooth knee drive. DON\u2019T reach. Pulls back under" },
  { id: "high-knees", name: "High Knees", section: "drills", sectionLabel: "Drills", sets: 2, detail: "2 × 10 sec", tip: 'Quick contacts, NOT max height. "Hot coals"' },
  { id: "easy-run", name: "Easy Run", section: "run", sectionLabel: "Run", sets: 1, detail: "Zone 2 · 30–40 min", tip: "Conversation pace. If you can\u2019t talk, slow down" },
  { id: "cooldown-walk", name: "Cooldown Walk", section: "recovery", sectionLabel: "Recovery", sets: 1, detail: "3–5 min" },
  { id: "foam-roll-quads", name: "Foam Roll Quads", section: "recovery", sectionLabel: "Recovery", sets: 1, detail: "45s each" },
  { id: "foam-roll-calves", name: "Foam Roll Calves", section: "recovery", sectionLabel: "Recovery", sets: 1, detail: "45s each" },
  { id: "hip-flexor-stretch", name: "Hip Flexor Stretch", section: "recovery", sectionLabel: "Recovery", sets: 1, detail: "30–45s hold" },
  { id: "calf-stretch", name: "Calf Stretch", section: "recovery", sectionLabel: "Recovery", sets: 1, detail: "30–45s hold" },
];

const SECTIONS = ["pre-run", "drills", "run", "recovery"];
const SECTION_NAMES: Record<string, string> = { "pre-run": "Activation", drills: "Drills", run: "Run", recovery: "Recovery" };

function ExerciseSVG({ id }: { id: string }) {
  const s = `0 0 200 200`;
  const common = { xmlns: "http://www.w3.org/2000/svg", viewBox: s, width: "100%", height: "100%", preserveAspectRatio: "xMidYMid slice" as const };

  switch (id) {
    case "wall-dorsiflexion":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.yellow} />
          <rect x="120" y="0" width="80" height="200" fill={C.black} />
          <rect x="120" y="140" width="80" height="60" fill={C.white} stroke={C.black} strokeWidth="3" />
          <ellipse cx="70" cy="165" rx="35" ry="18" fill={C.red} stroke={C.black} strokeWidth="3" />
          <line x1="70" y1="147" x2="70" y2="100" stroke={C.black} strokeWidth="3" />
          <line x1="70" y1="100" x2="70" y2="55" stroke={C.black} strokeWidth="3" />
          <line x1="70" y1="55" x2="95" y2="75" stroke={C.black} strokeWidth="3" />
          <polygon points="88,70 95,75 88,80" fill={C.black} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "ankle-circles":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.blue} />
          <ellipse cx="100" cy="130" rx="45" ry="25" fill={C.red} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="105" x2="100" y2="75" stroke={C.black} strokeWidth="3" />
          <path d="M 75 100 A 25 25 0 1 1 125 100" fill="none" stroke={C.black} strokeWidth="3" />
          <polygon points="118,95 125,100 118,105" fill={C.black} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "eversion-hold":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.orange} />
          <rect x="150" y="0" width="50" height="200" fill={C.black} />
          <ellipse cx="85" cy="110" rx="40" ry="22" fill={C.white} stroke={C.black} strokeWidth="3" />
          <path d="M 45 110 L 85 110" stroke={C.black} strokeWidth="3" />
          <polygon points="78,105 85,110 78,115" fill={C.black} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "short-foot":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.yellow} />
          <ellipse cx="100" cy="155" rx="55" ry="22" fill={C.red} stroke={C.black} strokeWidth="3" />
          <ellipse cx="100" cy="135" rx="35" ry="12" fill={C.white} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="123" x2="100" y2="85" stroke={C.black} strokeWidth="3" />
          <polygon points="93,92 100,75 107,92" fill={C.black} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "hip-flexor-march":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.blue} />
          <circle cx="100" cy="45" r="18" fill={C.red} stroke={C.black} strokeWidth="3" />
          <rect x="88" y="63" width="24" height="55" fill={C.yellow} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="118" x2="75" y2="175" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="118" x2="100" y2="175" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="85" x2="65" y2="70" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="85" x2="135" y2="70" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="118" x2="135" y2="95" stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "adduction-raises":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.teal} />
          <circle cx="140" cy="55" r="20" fill={C.red} stroke={C.black} strokeWidth="3" />
          <line x1="140" y1="75" x2="140" y2="100" stroke={C.black} strokeWidth="3" />
          <rect x="125" y="100" width="30" height="45" fill={C.yellow} stroke={C.black} strokeWidth="3" />
          <line x1="140" y1="145" x2="115" y2="185" stroke={C.black} strokeWidth="3" />
          <line x1="140" y1="145" x2="165" y2="185" stroke={C.black} strokeWidth="3" />
          <line x1="115" y1="185" x2="165" y2="185" stroke={C.black} strokeWidth="3" />
          <line x1="50" y1="185" x2="50" y2="140" stroke={C.black} strokeWidth="3" />
          <polygon points="43,135 50,125 57,135" fill={C.black} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "sl-balance":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.yellow} />
          <circle cx="100" cy="45" r="20" fill={C.red} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="65" x2="100" y2="95" stroke={C.black} strokeWidth="3" />
          <rect x="88" y="95" width="24" height="35" fill={C.white} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="85" x2="65" y2="75" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="85" x2="135" y2="75" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="130" x2="100" y2="175" stroke={C.black} strokeWidth="3" />
          <circle cx="100" cy="175" r="12" fill={C.orange} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "sl-rdl-reach":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.yellow} />
          <circle cx="100" cy="50" r="18" fill={C.red} stroke={C.black} strokeWidth="3" />
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
    case "a-skip":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.red} />
          <rect x="0" y="165" width="200" height="35" fill={C.black} />
          <circle cx="80" cy="50" r="16" fill={C.yellow} stroke={C.black} strokeWidth="3" />
          <line x1="80" y1="66" x2="80" y2="100" stroke={C.black} strokeWidth="3" />
          <rect x="70" y="100" width="20" height="35" fill={C.white} stroke={C.black} strokeWidth="3" />
          <line x1="80" y1="85" x2="55" y2="75" stroke={C.black} strokeWidth="3" />
          <line x1="80" y1="85" x2="105" y2="75" stroke={C.black} strokeWidth="3" />
          <line x1="80" y1="135" x2="65" y2="185" stroke={C.black} strokeWidth="3" />
          <line x1="80" y1="135" x2="95" y2="185" stroke={C.black} strokeWidth="3" />
          <line x1="80" y1="100" x2="95" y2="55" stroke={C.black} strokeWidth="3" />
          <polygon points="90,50 95,55 90,60" fill={C.black} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "b-skip":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.teal} />
          <rect x="0" y="165" width="200" height="35" fill={C.black} />
          <circle cx="90" cy="45" r="16" fill={C.yellow} stroke={C.black} strokeWidth="3" />
          <line x1="90" y1="61" x2="90" y2="95" stroke={C.black} strokeWidth="3" />
          <rect x="80" y="95" width="20" height="35" fill={C.white} stroke={C.black} strokeWidth="3" />
          <line x1="90" y1="80" x2="65" y2="70" stroke={C.black} strokeWidth="3" />
          <line x1="90" y1="80" x2="115" y2="70" stroke={C.black} strokeWidth="3" />
          <line x1="90" y1="130" x2="75" y2="185" stroke={C.black} strokeWidth="3" />
          <line x1="90" y1="130" x2="105" y2="185" stroke={C.black} strokeWidth="3" />
          <line x1="90" y1="95" x2="120" y2="70" stroke={C.black} strokeWidth="3" />
          <polygon points="115,65 120,70 115,75" fill={C.black} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "high-knees":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.orange} />
          <rect x="0" y="165" width="200" height="35" fill={C.black} />
          <circle cx="70" cy="50" r="16" fill={C.red} stroke={C.black} strokeWidth="3" />
          <line x1="70" y1="66" x2="70" y2="100" stroke={C.black} strokeWidth="3" />
          <rect x="60" y="100" width="20" height="35" fill={C.yellow} stroke={C.black} strokeWidth="3" />
          <line x1="70" y1="80" x2="50" y2="70" stroke={C.black} strokeWidth="3" />
          <line x1="70" y1="80" x2="90" y2="70" stroke={C.black} strokeWidth="3" />
          <line x1="70" y1="135" x2="55" y2="185" stroke={C.black} strokeWidth="3" />
          <line x1="70" y1="135" x2="85" y2="185" stroke={C.black} strokeWidth="3" />
          <line x1="70" y1="100" x2="70" y2="55" stroke={C.black} strokeWidth="3" />
          <polygon points="65,52 70,45 75,52" fill={C.black} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "easy-run":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.blue} />
          <circle cx="100" cy="55" r="18" fill={C.red} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="73" x2="100" y2="105" stroke={C.black} strokeWidth="3" />
          <rect x="88" y="105" width="24" height="40" fill={C.yellow} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="95" x2="75" y2="88" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="95" x2="125" y2="88" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="145" x2="85" y2="185" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="145" x2="115" y2="185" stroke={C.black} strokeWidth="3" />
          <path d="M 155 55 L 165 45 L 175 55 L 165 65 Z" fill={C.red} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "cooldown-walk":
      return (
        <svg {...common}>
          <rect width="200" height="120" fill={C.blue} stroke={C.black} strokeWidth="3" />
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
    case "foam-roll-quads":
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
    case "foam-roll-calves":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.blue} />
          <rect x="35" y="70" width="130" height="28" rx="14" fill={C.white} stroke={C.black} strokeWidth="3" />
          <circle cx="100" cy="45" r="18" fill={C.red} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="63" x2="100" y2="70" stroke={C.black} strokeWidth="3" />
          <rect x="88" y="70" width="24" height="50" fill={C.yellow} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="120" x2="75" y2="175" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="120" x2="125" y2="175" stroke={C.black} strokeWidth="3" />
          <ellipse cx="100" cy="175" rx="30" ry="12" fill={C.orange} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "hip-flexor-stretch":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.yellow} />
          <circle cx="100" cy="50" r="18" fill={C.red} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="68" x2="100" y2="95" stroke={C.black} strokeWidth="3" />
          <rect x="88" y="95" width="24" height="45" fill={C.white} stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="85" x2="70" y2="80" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="85" x2="130" y2="80" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="140" x2="65" y2="195" stroke={C.black} strokeWidth="3" />
          <line x1="100" y1="140" x2="135" y2="195" stroke={C.black} strokeWidth="3" />
        </svg>
      );
    case "calf-stretch":
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.blue} />
          <rect x="130" y="80" width="50" height="120" fill={C.white} stroke={C.black} strokeWidth="3" />
          <circle cx="85" cy="55" r="18" fill={C.red} stroke={C.black} strokeWidth="3" />
          <line x1="85" y1="73" x2="85" y2="100" stroke={C.black} strokeWidth="3" />
          <rect x="73" y="100" width="24" height="45" fill={C.yellow} stroke={C.black} strokeWidth="3" />
          <line x1="85" y1="90" x2="60" y2="85" stroke={C.black} strokeWidth="3" />
          <line x1="85" y1="90" x2="110" y2="85" stroke={C.black} strokeWidth="3" />
          <line x1="85" y1="145" x2="60" y2="195" stroke={C.black} strokeWidth="3" />
          <line x1="85" y1="145" x2="110" y2="195" stroke={C.black} strokeWidth="3" />
          <ellipse cx="85" cy="195" rx="28" ry="10" fill={C.orange} stroke={C.black} strokeWidth="3" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect width="200" height="200" fill={C.blue} />
          <circle cx="100" cy="100" r="50" fill={C.yellow} stroke={C.black} strokeWidth="3" />
        </svg>
      );
  }
}

export default function ThursdayWorkoutPage() {
  return (
    <WorkoutPage
      exercises={EXERCISES}
      sections={SECTIONS}
      sectionNames={SECTION_NAMES}
      storageKey={STORAGE_KEY}
      heights={HEIGHTS}
      art={ExerciseSVG}
      title="Thursday"
      subtitle="Run Skill Day"
    />
  );
}
