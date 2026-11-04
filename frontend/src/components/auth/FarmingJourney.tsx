import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './FarmingJourney.css'

// ── Types ─────────────────────────────────────────────────────────────────────

export type FarmingJourneyLang = 'en' | 'hi'

interface StageData {
  id: string
  titleEn: string
  titleHi: string
  dotEn: string
  dotHi: string
  pointsEn: readonly string[]
  pointsHi: readonly string[]
  scene: React.ReactNode
  accentClass: string
}

interface FarmingJourneyProps {
  lang: FarmingJourneyLang
}

// ── SVG Scene Illustrations (7 Complete Crop Lifecycle Stages) ────────────────

function SoilScene() {
  return (
    <svg
      viewBox="0 0 220 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="fj-scene-svg"
    >
      {/* Sky */}
      <rect width="220" height="68" fill="#c9e8b5" />
      {/* Sun */}
      <circle cx="186" cy="24" r="15" fill="#f5d060" />
      <line x1="186" y1="4" x2="186" y2="10" stroke="#f5d060" strokeWidth="2" strokeLinecap="round" />
      <line x1="202" y1="10" x2="207" y2="5" stroke="#f5d060" strokeWidth="2" strokeLinecap="round" />
      <line x1="206" y1="24" x2="212" y2="24" stroke="#f5d060" strokeWidth="2" strokeLinecap="round" />
      {/* Clouds */}
      <ellipse cx="60" cy="18" rx="22" ry="10" fill="#fff" fillOpacity="0.7" />
      <ellipse cx="78" cy="14" rx="14" ry="10" fill="#fff" fillOpacity="0.7" />
      <ellipse cx="42" cy="14" rx="12" ry="9" fill="#fff" fillOpacity="0.7" />
      {/* Soil */}
      <rect y="68" width="220" height="62" fill="#8b5e3c" />
      {/* Ploughed furrows */}
      <path d="M0 76 Q110 71 220 76" stroke="#6b4226" strokeWidth="2.5" fill="none" />
      <path d="M0 89 Q110 84 220 89" stroke="#6b4226" strokeWidth="2.5" fill="none" />
      <path d="M0 102 Q110 97 220 102" stroke="#6b4226" strokeWidth="2.5" fill="none" />
      <path d="M0 115 Q110 110 220 115" stroke="#6b4226" strokeWidth="2.5" fill="none" />
      {/* Tractor body */}
      <rect x="62" y="42" width="44" height="26" rx="5" fill="#4a7c59" />
      <rect x="70" y="34" width="26" height="16" rx="4" fill="#5d8f6e" />
      {/* Wheels */}
      <circle cx="72" cy="70" r="10" fill="#2c4930" stroke="#1a2e1d" strokeWidth="2" />
      <circle cx="100" cy="70" r="8" fill="#2c4930" stroke="#1a2e1d" strokeWidth="2" />
      {/* Exhaust pipe */}
      <line x1="92" y1="34" x2="92" y2="26" stroke="#555" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="92" cy="24" r="3" fill="#888" fillOpacity="0.5" />
      {/* Plough attachment */}
      <path d="M62 60 L46 64 L46 70 L62 68" fill="#3a5c40" />
    </svg>
  )
}

function SowingScene() {
  return (
    <svg
      viewBox="0 0 220 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="fj-scene-svg"
    >
      {/* Sky */}
      <rect width="220" height="68" fill="#dff2c2" />
      {/* Sun */}
      <circle cx="195" cy="20" r="14" fill="#f0d050" />
      {/* Soil base */}
      <rect y="68" width="220" height="62" fill="#7a4f2d" />
      {/* Furrow rows */}
      <path d="M0 75 Q110 71 220 75" stroke="#5c3a1e" strokeWidth="2" fill="none" />
      <path d="M0 90 Q110 86 220 90" stroke="#5c3a1e" strokeWidth="2" fill="none" />
      <path d="M0 105 Q110 101 220 105" stroke="#5c3a1e" strokeWidth="2" fill="none" />
      {/* Seeds in rows — animated */}
      <ellipse cx="26" cy="76" rx="7" ry="5" fill="#c8a86e" className="fj-seed-dot fj-sd-0" />
      <ellipse cx="58" cy="90" rx="7" ry="5" fill="#c8a86e" className="fj-seed-dot fj-sd-1" />
      <ellipse cx="90" cy="76" rx="7" ry="5" fill="#c8a86e" className="fj-seed-dot fj-sd-2" />
      <ellipse cx="122" cy="90" rx="7" ry="5" fill="#c8a86e" className="fj-seed-dot fj-sd-3" />
      <ellipse cx="154" cy="76" rx="7" ry="5" fill="#c8a86e" className="fj-seed-dot fj-sd-4" />
      <ellipse cx="186" cy="90" rx="7" ry="5" fill="#c8a86e" className="fj-seed-dot fj-sd-5" />
      {/* Spacing dashes */}
      <line x1="26" y1="65" x2="58" y2="65" stroke="#5aac4a" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
      <line x1="58" y1="65" x2="90" y2="65" stroke="#5aac4a" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
      <line x1="90" y1="65" x2="122" y2="65" stroke="#5aac4a" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.8" />
      {/* Calendar in upper right */}
      <rect x="150" y="14" width="46" height="38" rx="6" fill="#fff" fillOpacity="0.85" />
      <rect x="150" y="14" width="46" height="12" rx="6" fill="#4a8a3e" />
      <text x="163" y="42" fontSize="14" fill="#4a8a3e" fontFamily="sans-serif" fontWeight="bold">15</text>
      {/* Seed bag */}
      <rect x="8" y="28" width="24" height="32" rx="4" fill="#c8a86e" />
      <ellipse cx="20" cy="28" rx="12" ry="5" fill="#b89050" />
      <text x="14" y="46" fontSize="7" fill="#7a5020" fontFamily="sans-serif">SEED</text>
    </svg>
  )
}

function GerminationScene() {
  const sprouts = [30, 75, 120, 165, 200]
  return (
    <svg
      viewBox="0 0 220 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="fj-scene-svg"
    >
      {/* Sky with soft morning warmth */}
      <rect width="220" height="68" fill="#e2f5d3" />
      <circle cx="180" cy="22" r="16" fill="#fde68a" opacity="0.9" />
      {/* Soil */}
      <rect y="68" width="220" height="62" fill="#784e2d" />
      <line x1="0" y1="68" x2="220" y2="68" stroke="#54371f" strokeWidth="2" />
      {/* Roots below soil line and emerging tender shoots */}
      {sprouts.map((x, i) => (
        <g key={i} className={`fj-sprout fj-sprout-${i}`}>
          {/* Seed coat */}
          <circle cx={x} cy="86" r="4.5" fill="#a07040" />
          {/* Fine rootlets spreading into soil */}
          <path d={`M${x} 90 Q${x - 6} 102 ${x - 4} 112`} stroke="#d8bc98" strokeWidth="1.5" strokeLinecap="round" />
          <path d={`M${x} 90 Q${x + 6} 104 ${x + 5} 115`} stroke="#d8bc98" strokeWidth="1.5" strokeLinecap="round" />
          {/* Sprout stem reaching above soil */}
          <path d={`M${x} 86 Q${x - 2} 74 ${x} 54`} stroke="#68bb48" strokeWidth="2.5" strokeLinecap="round" />
          {/* Cotyledon dual leaf pairs unfolding */}
          <ellipse cx={x - 6} cy="52" rx="7" ry="4" fill="#7dd358" transform={`rotate(-28 ${x - 6} 52)`} />
          <ellipse cx={x + 6} cy="52" rx="7" ry="4" fill="#68bb48" transform={`rotate(28 ${x + 6} 52)`} />
        </g>
      ))}
    </svg>
  )
}

function IrrigationScene() {
  return (
    <svg
      viewBox="0 0 220 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="fj-scene-svg"
    >
      {/* Sky */}
      <rect width="220" height="68" fill="#d2eef8" />
      {/* Main drip line */}
      <line x1="8" y1="28" x2="212" y2="28" stroke="#5a9ac8" strokeWidth="3.5" strokeLinecap="round" />
      {/* Sprinkler head */}
      <circle cx="8" cy="28" r="6" fill="#3a7aac" />
      <path d="M8 22 L4 12 M8 22 L12 12 M8 22 L0 14 M8 22 L16 14" stroke="#5ab8f0" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      {/* Drip emitter drops */}
      <circle cx="52" cy="28" r="3" fill="#3a7aac" />
      <path d="M52 31 Q49 42 52 46 Q55 42 52 31" fill="#60b4e0" className="fj-drop fj-drop-0" />
      <circle cx="104" cy="28" r="3" fill="#3a7aac" />
      <path d="M104 31 Q101 42 104 46 Q107 42 104 31" fill="#60b4e0" className="fj-drop fj-drop-1" />
      <circle cx="156" cy="28" r="3" fill="#3a7aac" />
      <path d="M156 31 Q153 42 156 46 Q159 42 156 31" fill="#60b4e0" className="fj-drop fj-drop-2" />
      <circle cx="208" cy="28" r="3" fill="#3a7aac" />
      <path d="M208 31 Q205 42 208 46 Q211 42 208 31" fill="#60b4e0" className="fj-drop fj-drop-3" />
      {/* Soil */}
      <rect y="68" width="220" height="62" fill="#7a6040" />
      {/* Plants with leaves */}
      {[52, 104, 156].map((x, i) => (
        <g key={i} className="fj-irrig-plant">
          <line x1={x} y1="68" x2={x} y2="46" stroke="#4a8a3e" strokeWidth="3.5" strokeLinecap="round" />
          <ellipse cx={x - 10} cy="56" rx="11" ry="6" fill="#6aac5a" transform={`rotate(-30 ${x - 10} 56)`} />
          <ellipse cx={x + 10} cy="52" rx="11" ry="6" fill="#5a9a4a" transform={`rotate(30 ${x + 10} 52)`} />
        </g>
      ))}
      {/* Soil moisture gauge */}
      <rect x="195" y="72" width="14" height="36" rx="4" fill="#c8e8f4" />
      <rect x="195" y="88" width="14" height="20" rx="4" fill="#3a7aac" />
      <text x="197" y="71" fontSize="7" fill="#3a7aac" fontFamily="sans-serif">💧</text>
    </svg>
  )
}

function GrowthScene() {
  const crops = [
    { x: 34, stemTop: 20, leafOffset: 10 },
    { x: 76, stemTop: 12, leafOffset: 12 },
    { x: 118, stemTop: 16, leafOffset: 10 },
    { x: 160, stemTop: 18, leafOffset: 11 },
    { x: 200, stemTop: 22, leafOffset: 9 },
  ]
  return (
    <svg
      viewBox="0 0 220 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="fj-scene-svg"
    >
      {/* Sky */}
      <rect width="220" height="68" fill="#c4eebc" />
      {/* Sun */}
      <circle cx="28" cy="22" r="14" fill="#f5d040" opacity="0.9" />
      {/* Clouds */}
      <ellipse cx="130" cy="16" rx="24" ry="10" fill="#fff" fillOpacity="0.65" />
      <ellipse cx="150" cy="12" rx="16" ry="10" fill="#fff" fillOpacity="0.65" />
      <ellipse cx="112" cy="12" rx="14" ry="9" fill="#fff" fillOpacity="0.65" />
      {/* Soil */}
      <rect y="68" width="220" height="62" fill="#7a5030" />
      {/* Growing crops */}
      {crops.map((c, i) => (
        <g key={i} className={`fj-crop fj-crop-${i}`} style={{ transformOrigin: `${c.x}px 68px` }}>
          <line
            x1={c.x}
            y1="68"
            x2={c.x}
            y2={c.stemTop}
            stroke="#3a7a2e"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <ellipse
            cx={c.x - c.leafOffset}
            cy={(68 + c.stemTop) / 2 + 6}
            rx="13"
            ry="7"
            fill="#5aac4a"
            transform={`rotate(-35 ${c.x - c.leafOffset} ${(68 + c.stemTop) / 2 + 6})`}
          />
          <ellipse
            cx={c.x + c.leafOffset}
            cy={(68 + c.stemTop) / 2}
            rx="13"
            ry="7"
            fill="#4a9c3a"
            transform={`rotate(35 ${c.x + c.leafOffset} ${(68 + c.stemTop) / 2})`}
          />
          {i % 2 === 0 ? (
            <circle cx={c.x} cy={c.stemTop - 4} r="5" fill="#ffcf60" opacity="0.95" />
          ) : (
            <circle cx={c.x} cy={c.stemTop - 4} r="5" fill="#ff9a5a" opacity="0.9" />
          )}
        </g>
      ))}
    </svg>
  )
}

function MatureScene() {
  const plants = [28, 64, 100, 136, 172, 204]
  return (
    <svg
      viewBox="0 0 220 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="fj-scene-svg"
    >
      {/* Warm Golden Harvest Sky */}
      <rect width="220" height="68" fill="#f8e7b9" />
      <circle cx="190" cy="22" r="15" fill="#f59e0b" opacity="0.9" />
      {/* Soil */}
      <rect y="68" width="220" height="62" fill="#784724" />
      {/* Mature crop canopies with ripe grain heads and fruit */}
      {plants.map((x, i) => (
        <g key={i} className={`fj-mature fj-mature-${i}`} style={{ transformOrigin: `${x}px 68px` }}>
          {/* Strong mature stalk */}
          <line x1={x} y1="68" x2={x} y2="18" stroke="#a16207" strokeWidth="4" strokeLinecap="round" />
          {/* Rich golden-green leaves */}
          <ellipse cx={x - 12} cy="38" rx="14" ry="7" fill="#84cc16" transform={`rotate(-25 ${x - 12} 38)`} />
          <ellipse cx={x + 12} cy="34" rx="14" ry="7" fill="#65a30d" transform={`rotate(25 ${x + 12} 34)`} />
          {/* Heavy golden grain ear / ripe produce head */}
          <ellipse cx={x} cy="14" rx="7" ry="12" fill="#eab308" />
          <circle cx={x - 2} cy="12" r="2.5" fill="#ca8a04" />
          <circle cx={x + 2} cy="16" r="2.5" fill="#ca8a04" />
        </g>
      ))}
    </svg>
  )
}

function HarvestScene() {
  const xs = [22, 48, 74, 100, 126, 152, 178, 206]
  return (
    <svg
      viewBox="0 0 220 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="fj-scene-svg"
    >
      <defs>
        <linearGradient id="fj-sky-harvest" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5c060" />
          <stop offset="100%" stopColor="#f5e0a0" />
        </linearGradient>
      </defs>
      {/* Warm evening sky */}
      <rect width="220" height="68" fill="url(#fj-sky-harvest)" />
      {/* Setting sun */}
      <circle cx="20" cy="62" r="24" fill="#f09828" opacity="0.85" />
      <rect y="58" width="220" height="10" fill="#f5e0a0" />
      {/* Soil */}
      <rect y="68" width="220" height="62" fill="#8a6038" />
      {/* Wheat stalks */}
      {xs.map((x, i) => (
        <g key={i} className={`fj-wheat fj-wheat-${i % 8}`} style={{ transformOrigin: `${x}px 68px` }}>
          <line x1={x} y1="68" x2={x} y2="26" stroke="#c8a030" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx={x} cy="21" rx="5" ry="9" fill="#d4b040" />
          <line x1={x - 3} y1="18" x2={x - 9} y2="13" stroke="#c8a030" strokeWidth="1.5" strokeLinecap="round" />
          <line x1={x + 3} y1="18" x2={x + 9} y2="13" stroke="#c8a030" strokeWidth="1.5" strokeLinecap="round" />
          <line x1={x - 3} y1="26" x2={x - 9} y2="21" stroke="#c8a030" strokeWidth="1.5" strokeLinecap="round" />
          <line x1={x + 3} y1="26" x2={x + 9} y2="21" stroke="#c8a030" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      ))}
      {/* Harvested bundles */}
      <rect x="6" y="86" width="36" height="20" rx="5" fill="#c89028" opacity="0.95" />
      <line x1="6" y1="96" x2="42" y2="96" stroke="#a07020" strokeWidth="2" />
      <line x1="24" y1="86" x2="24" y2="106" stroke="#a07020" strokeWidth="2" />
      <rect x="50" y="90" width="30" height="16" rx="4" fill="#c89028" opacity="0.9" />
      <line x1="65" y1="90" x2="65" y2="106" stroke="#a07020" strokeWidth="1.5" />
    </svg>
  )
}

// ── Complete 7-Stage Crop Lifecycle Data ──────────────────────────────────────

const STAGES: StageData[] = [
  {
    id: 'soil',
    titleEn: '1. Soil Preparation',
    titleHi: '1. मिट्टी की तैयारी',
    dotEn: 'Soil',
    dotHi: 'मिट्टी',
    pointsEn: [
      'Deep ploughing loosens compacted soil layers',
      'Laser land levelling ensures uniform irrigation distribution',
      'Basal manure and organic compost application enrich fertility',
    ],
    pointsHi: [
      'गहरी जुताई से मिट्टी भुरभुरी और हवादार बनती है',
      'भूमि समतलीकरण से सिंचाई का पानी समान रूप से फैलता है',
      'बुआई से पहले आधार खाद और पोषक तत्वों का संतुलित प्रयोग',
    ],
    scene: <SoilScene />,
    accentClass: 'fj-accent-soil',
  },
  {
    id: 'sowing',
    titleEn: '2. Sowing Seeds',
    titleHi: '2. बीज बुआई',
    dotEn: 'Sowing',
    dotHi: 'बुआई',
    pointsEn: [
      'Certified high-germination seed variety selection',
      'Accurate seed spacing and calibrated depth control',
      'Optimal sowing calendar aligned with local agro-climatic zone',
    ],
    pointsHi: [
      'प्रमाणित उच्च अंकुरण क्षमता वाले बीजों का चयन',
      'कतारों के बीच सटीक दूरी और उचित गहराई नियंत्रण',
      'स्थानीय कृषि-जलवायु के अनुसार इष्टतम बुआई समय',
    ],
    scene: <SowingScene />,
    accentClass: 'fj-accent-sowing',
  },
  {
    id: 'germination',
    titleEn: '3. Germination',
    titleHi: '3. अंकुरण अवस्था',
    dotEn: 'Sprout',
    dotHi: 'अंकुरण',
    pointsEn: [
      'Seed imbibition and radicle emergence within target days',
      'Sub-surface root anchorage and cotyledon leaf opening',
      'Monitoring seedling density and initial soil moisture level',
    ],
    pointsHi: [
      'नमी अवशोषण के बाद नन्हें पौधे का सफल अंकुरण',
      'मजबूत प्राथमिक जड़ विकास और प्रथम पत्तियों का फैलाव',
      'खेत में अंकुरण घनत्व और मिट्टी की नमी का सटीक अवलोकन',
    ],
    scene: <GerminationScene />,
    accentClass: 'fj-accent-germination',
  },
  {
    id: 'irrigation',
    titleEn: '4. Irrigation',
    titleHi: '4. सटीक सिंचाई',
    dotEn: 'Irrigation',
    dotHi: 'सिंचाई',
    pointsEn: [
      'Automated drip & micro-sprinkler precision delivery',
      'Stage-based irrigation scheduling tailored to crop water demand',
      'Continuous soil moisture monitoring to prevent waterlogging',
    ],
    pointsHi: [
      'ड्रिप और सूक्ष्म-फव्वारा प्रणाली से जल का कुशल उपयोग',
      'फसल की आवश्यकता के अनुसार समयबद्ध सिंचाई चक्र',
      'मृदा नमी सेंसर द्वारा जलभराव और तनाव की रोकथाम',
    ],
    scene: <IrrigationScene />,
    accentClass: 'fj-accent-irrigation',
  },
  {
    id: 'growth',
    titleEn: '5. Crop Growth',
    titleHi: '5. वानस्पतिक वृद्धि',
    dotEn: 'Growth',
    dotHi: 'वृद्धि',
    pointsEn: [
      'Active vegetative expansion and dense canopy formation',
      'Balanced nutrient fertigation and pest scouting routines',
      'Flowering initiation and reproductive health maintenance',
    ],
    pointsHi: [
      'सघन पत्तियों और तनों का तीव्र वानस्पतिक विकास',
      'संतुलित पोषक तत्व प्रबंधन और नियमित कीट निगरानी',
      'फूल आने और फल/दाने बनने की महत्वपूर्ण अवस्था',
    ],
    scene: <GrowthScene />,
    accentClass: 'fj-accent-growth',
  },
  {
    id: 'mature',
    titleEn: '6. Mature Crops',
    titleHi: '6. परिपक्व फसल',
    dotEn: 'Mature',
    dotHi: 'परिपक्व',
    pointsEn: [
      'Uniform grain filling, color transition, and seed hardening',
      'Periodic moisture checking to determine peak maturity index',
      'Preparation of storage facilities and harvesting equipment',
    ],
    pointsHi: [
      'दानों का पूर्ण भराव, प्राकृतिक रंग परिवर्तन और कड़ापन',
      'कटाई के सही समय के लिए दानों में नमी का परीक्षण',
      'कटाई उपकरणों और सुरक्षित भंडारण की पूर्व तैयारी',
    ],
    scene: <MatureScene />,
    accentClass: 'fj-accent-mature',
  },
  {
    id: 'harvest',
    titleEn: '7. Harvesting',
    titleHi: '7. फसल कटाई',
    dotEn: 'Harvest',
    dotHi: 'कटाई',
    pointsEn: [
      'Timely mechanical or manual harvest at optimal moisture',
      'Post-harvest collection, grading, and field clearing',
      'Accurate yield logging linked to farm analytics and inventory',
    ],
    pointsHi: [
      'इष्टतम नमी पर समय पर वैज्ञानिक तरीके से कटाई',
      'उपज का सुरक्षित एकत्रीकरण, ग्रेडिंग और खेत की सफाई',
      'सटीक उत्पादन रिकॉर्ड का कृषि एनालिटिक्स में पंजीकरण',
    ],
    scene: <HarvestScene />,
    accentClass: 'fj-accent-harvest',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function FarmingJourney({ lang }: FarmingJourneyProps) {
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [timerKey, setTimerKey] = useState(0)

  // Read motion preference once on mount via ref — stable across renders
  const prefersReducedRef = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )

  // Auto-advance timer; resets when hovered, timerKey, or motion pref changes
  useEffect(() => {
    if (prefersReducedRef.current || hovered) return
    const id = setInterval(() => setIndex((i) => (i + 1) % STAGES.length), 5500)
    return () => clearInterval(id)
  }, [hovered, timerKey])

  /** Navigate to a specific stage and reset the auto-advance interval */
  function goTo(i: number) {
    setIndex(i)
    setTimerKey((k) => k + 1)
  }

  const stage = STAGES[index]
  const isReduced = prefersReducedRef.current

  return (
    <div
      className={`fj-panel ${stage.accentClass}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="region"
      aria-label={lang === 'en' ? 'Interactive Crop Farming Journey' : 'इंटरएक्टिव फसल चक्र यात्रा'}
    >
      {/* Scene illustration */}
      <div className="fj-scene" aria-hidden="true">
        {stage.scene}
      </div>

      {/* Bilingual text — re-keyed on stage change to trigger fade-in */}
      <div className="fj-content" key={stage.id}>
        <div className="fj-header-line">
          <p className="fj-label">
            {lang === 'en'
              ? `Stage ${index + 1} of ${STAGES.length}`
              : `चरण ${index + 1} / ${STAGES.length}`}
          </p>
          <span className="fj-cycle-tag">
            {lang === 'en' ? 'Crop Lifecycle' : 'फसल चक्र'}
          </span>
        </div>
        <h2 className="fj-title">
          {lang === 'en' ? stage.titleEn : stage.titleHi}
        </h2>
        {lang === 'hi' && (
          <p className="fj-title-en">{stage.titleEn}</p>
        )}
        <ul
          className="fj-points"
          aria-label={lang === 'en' ? 'Key operational steps' : 'मुख्य कृषि कार्य'}
        >
          {(lang === 'en' ? stage.pointsEn : stage.pointsHi).map((pt, i) => (
            <li key={i}>{pt}</li>
          ))}
        </ul>
      </div>

      {/* Navigation */}
      <div className="fj-nav-bar">
        <button
          type="button"
          className="fj-nav-btn"
          onClick={() => goTo((index - 1 + STAGES.length) % STAGES.length)}
          aria-label={lang === 'en' ? 'Previous farming stage' : 'पिछला फसल चरण'}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        <div
          className="fj-dots"
          role="group"
          aria-label={lang === 'en' ? 'Crop stage indicators' : 'फसल चरण संकेतक'}
        >
          {STAGES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`fj-dot${i === index ? ' active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={
                lang === 'en'
                  ? `Stage ${i + 1}: ${s.dotEn}`
                  : `चरण ${i + 1}: ${s.dotHi}`
              }
              aria-current={i === index ? 'step' : undefined}
            />
          ))}
        </div>

        <button
          type="button"
          className="fj-nav-btn"
          onClick={() => goTo((index + 1) % STAGES.length)}
          aria-label={lang === 'en' ? 'Next farming stage' : 'अगला फसल चरण'}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Progress bar — omitted when reduced motion is preferred */}
      {!isReduced && (
        <div className="fj-progress" aria-hidden="true">
          <div
            className="fj-progress-fill"
            key={`${index}-${timerKey}`}
            style={{ animationPlayState: hovered ? 'paused' : 'running' }}
          />
        </div>
      )}
    </div>
  )
}
