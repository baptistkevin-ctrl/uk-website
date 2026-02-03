// Premium Flat Category Icons - Clean & Professional Style

export function VegetablesIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Carrot body */}
      <path d="M32 56L22 28C22 22 26 18 32 18C38 18 42 22 42 28L32 56Z" fill="#FF9800"/>
      <path d="M32 56L26 32C26 26 28 22 32 22C36 22 38 26 38 32L32 56Z" fill="#FFB74D"/>
      {/* Carrot lines */}
      <path d="M28 30C28 30 27 40 29 48" stroke="#E65100" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      <path d="M36 30C36 30 37 40 35 48" stroke="#E65100" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      {/* Leaves */}
      <ellipse cx="26" cy="14" rx="6" ry="10" fill="#4CAF50" transform="rotate(-20 26 14)"/>
      <ellipse cx="32" cy="12" rx="5" ry="12" fill="#66BB6A"/>
      <ellipse cx="38" cy="14" rx="6" ry="10" fill="#4CAF50" transform="rotate(20 38 14)"/>
    </svg>
  )
}

export function FruitsIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Apple body */}
      <path d="M32 54C18 54 12 42 12 32C12 22 20 14 32 14C44 14 52 22 52 32C52 42 46 54 32 54Z" fill="#F44336"/>
      <path d="M32 54C24 54 18 44 18 34C18 24 24 18 32 18C40 18 46 24 46 34C46 44 40 54 32 54Z" fill="#EF5350"/>
      {/* Indent at top */}
      <path d="M28 16C30 18 34 18 36 16" stroke="#C62828" strokeWidth="2" strokeLinecap="round"/>
      {/* Stem */}
      <rect x="30" y="6" width="4" height="10" rx="2" fill="#795548"/>
      {/* Leaf */}
      <ellipse cx="40" cy="10" rx="8" ry="5" fill="#4CAF50" transform="rotate(30 40 10)"/>
      {/* Highlight */}
      <ellipse cx="22" cy="30" rx="4" ry="6" fill="white" opacity="0.3"/>
    </svg>
  )
}

export function DairyIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Milk carton body */}
      <rect x="14" y="20" width="36" height="38" rx="2" fill="#FAFAFA"/>
      <rect x="14" y="20" width="36" height="38" rx="2" fill="url(#milkGrad)"/>
      {/* Top fold */}
      <path d="M14 20L24 8H40L50 20H14Z" fill="#2196F3"/>
      <path d="M24 8L32 4L40 8" fill="#1976D2"/>
      {/* Cap */}
      <rect x="28" y="2" width="8" height="6" rx="2" fill="#1565C0"/>
      {/* Blue stripe */}
      <rect x="14" y="32" width="36" height="12" fill="#2196F3"/>
      {/* Milk splash icon */}
      <circle cx="32" cy="46" r="6" fill="#E3F2FD"/>
      <path d="M29 44C29 44 32 40 35 44" stroke="#2196F3" strokeWidth="2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="milkGrad" x1="14" y1="20" x2="50" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FAFAFA"/>
          <stop offset="1" stopColor="#E0E0E0"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

export function MeatPoultryIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Drumstick meat */}
      <ellipse cx="26" cy="22" rx="18" ry="14" fill="#D84315"/>
      <ellipse cx="26" cy="22" rx="14" ry="10" fill="#FF5722"/>
      <ellipse cx="24" cy="20" rx="8" ry="5" fill="#FF8A65" opacity="0.6"/>
      {/* Leg bone area */}
      <path d="M38 30L52 50C54 54 52 58 48 58C44 58 42 54 44 50L38 30Z" fill="#D84315"/>
      <path d="M40 32L50 48C52 52 50 56 48 56C46 56 44 52 46 48L40 32Z" fill="#FF5722"/>
      {/* Bone end */}
      <circle cx="48" cy="56" r="6" fill="#FFF8E1"/>
      <circle cx="52" cy="58" r="4" fill="#FFF8E1"/>
      <circle cx="46" cy="60" r="3" fill="#FFF8E1"/>
    </svg>
  )
}

export function FishSeafoodIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Fish body */}
      <ellipse cx="30" cy="32" rx="24" ry="14" fill="#2196F3"/>
      <ellipse cx="28" cy="34" rx="18" ry="8" fill="#64B5F6"/>
      {/* Tail */}
      <path d="M52 32L62 20V44L52 32Z" fill="#1976D2"/>
      {/* Top fin */}
      <path d="M24 18C24 18 30 10 40 18" fill="#1976D2"/>
      {/* Bottom fin */}
      <path d="M28 46C28 46 32 52 38 46" fill="#1976D2"/>
      {/* Eye */}
      <circle cx="14" cy="28" r="6" fill="white"/>
      <circle cx="12" cy="27" r="4" fill="#1A237E"/>
      <circle cx="11" cy="26" r="1.5" fill="white"/>
      {/* Gills */}
      <path d="M22 26C22 26 20 32 22 38" stroke="#1565C0" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function BakeryIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bread base */}
      <ellipse cx="32" cy="50" rx="28" ry="8" fill="#A1887F"/>
      {/* Bread body */}
      <path d="M4 44C4 44 4 30 14 22C22 16 32 14 32 14C32 14 42 16 50 22C60 30 60 44 60 44" fill="#FFCA28"/>
      {/* Bread bumps */}
      <ellipse cx="18" cy="22" rx="12" ry="10" fill="#FFD54F"/>
      <ellipse cx="32" cy="18" rx="14" ry="12" fill="#FFE082"/>
      <ellipse cx="46" cy="22" rx="12" ry="10" fill="#FFD54F"/>
      {/* Score marks */}
      <path d="M18 26L18 38" stroke="#F9A825" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M32 22L32 36" stroke="#F9A825" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M46 26L46 38" stroke="#F9A825" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  )
}

export function FrozenIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ice cream cone */}
      <path d="M24 36L32 60L40 36" fill="#D7CCC8"/>
      <path d="M26 38L32 56L38 38" fill="#BCAAA4"/>
      {/* Cone pattern */}
      <path d="M26 40L38 48M38 40L26 48" stroke="#A1887F" strokeWidth="1" opacity="0.5"/>
      {/* Pink scoop */}
      <circle cx="24" cy="28" r="12" fill="#F48FB1"/>
      <ellipse cx="20" cy="24" rx="4" ry="3" fill="#F8BBD0" opacity="0.6"/>
      {/* Yellow scoop */}
      <circle cx="40" cy="28" r="12" fill="#FFF59D"/>
      <ellipse cx="36" cy="24" rx="4" ry="3" fill="#FFFDE7" opacity="0.6"/>
      {/* Mint scoop on top */}
      <circle cx="32" cy="14" r="12" fill="#80DEEA"/>
      <ellipse cx="28" cy="10" rx="4" ry="3" fill="#B2EBF2" opacity="0.6"/>
      {/* Cherry */}
      <circle cx="32" cy="4" r="4" fill="#E91E63"/>
      <path d="M32 2L36 -2" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function BeveragesIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Can body */}
      <rect x="14" y="10" width="36" height="48" rx="4" fill="#E53935"/>
      <rect x="18" y="14" width="28" height="40" rx="2" fill="#EF5350"/>
      {/* Top rim */}
      <ellipse cx="32" cy="10" rx="18" ry="4" fill="#C62828"/>
      <ellipse cx="32" cy="10" rx="14" ry="2.5" fill="#B71C1C"/>
      {/* Pull tab */}
      <ellipse cx="32" cy="10" rx="8" ry="2" fill="#BDBDBD"/>
      <ellipse cx="36" cy="10" rx="4" ry="1.5" fill="#9E9E9E"/>
      {/* White wave design */}
      <path d="M14 36C22 32 26 40 32 36C38 32 42 40 50 36V50C50 54 46 58 32 58C18 58 14 54 14 50V36Z" fill="white" opacity="0.9"/>
      {/* Bottom */}
      <ellipse cx="32" cy="58" rx="18" ry="3" fill="#B71C1C"/>
    </svg>
  )
}

export function SnacksIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Chip bag */}
      <path d="M12 14H52L46 58H18L12 14Z" fill="#FFC107"/>
      <path d="M16 18H48L44 54H20L16 18Z" fill="#FFD54F"/>
      {/* Top crimp */}
      <path d="M12 14C12 14 20 18 32 18C44 18 52 14 52 14" stroke="#FFA000" strokeWidth="2"/>
      <rect x="24" y="8" width="16" height="8" rx="2" fill="#FF8F00"/>
      {/* Chip illustration */}
      <ellipse cx="32" cy="36" rx="12" ry="8" fill="#FFE082"/>
      <ellipse cx="32" cy="34" rx="8" ry="5" fill="#FFF8E1"/>
      {/* Wavy chip edges */}
      <path d="M22 36C24 34 26 38 28 36C30 34 32 38 34 36C36 34 38 38 40 36C42 34 44 38 42 36" stroke="#FFB300" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function DrinksIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Juice box */}
      <rect x="14" y="16" width="36" height="42" rx="2" fill="#FF9800"/>
      <rect x="18" y="20" width="28" height="34" rx="1" fill="#FFB74D"/>
      {/* Top fold */}
      <path d="M14 16L22 6H42L50 16H14Z" fill="#E65100"/>
      <path d="M22 6L32 2L42 6" fill="#BF360C"/>
      {/* Straw */}
      <rect x="38" y="0" width="6" height="24" rx="3" fill="#E91E63"/>
      <rect x="40" y="2" width="2" height="20" rx="1" fill="#F48FB1"/>
      {/* Orange slice */}
      <circle cx="32" cy="40" r="12" fill="#FFF3E0"/>
      <circle cx="32" cy="40" r="8" fill="#FFE0B2"/>
      {/* Orange segments */}
      <path d="M32 32V48M24 40H40M26 34L38 46M38 34L26 46" stroke="#FF9800" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function FrozenFoodsIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Frozen box */}
      <rect x="8" y="16" width="48" height="42" rx="4" fill="#0288D1"/>
      <rect x="12" y="20" width="40" height="34" rx="2" fill="#03A9F4"/>
      {/* Lid */}
      <rect x="6" y="12" width="52" height="8" rx="2" fill="#01579B"/>
      {/* Snowflake */}
      <path d="M32 28V52" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <path d="M20 40H44" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <path d="M23 31L41 49" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <path d="M41 31L23 49" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      {/* Snowflake details */}
      <circle cx="32" cy="28" r="2" fill="white"/>
      <circle cx="32" cy="52" r="2" fill="white"/>
      <circle cx="20" cy="40" r="2" fill="white"/>
      <circle cx="44" cy="40" r="2" fill="white"/>
    </svg>
  )
}

export function HouseholdIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Spray bottle body */}
      <path d="M16 28H40L42 58C42 60 38 62 28 62C18 62 14 60 14 58L16 28Z" fill="#7E57C2"/>
      <path d="M20 32H36L38 56C38 58 34 60 28 60C22 60 18 58 18 56L20 32Z" fill="#9575CD"/>
      {/* Neck */}
      <rect x="24" y="18" width="12" height="12" rx="1" fill="#7E57C2"/>
      {/* Trigger */}
      <path d="M36 20H52C54 20 56 24 54 28L46 40H40V20Z" fill="#B39DDB"/>
      <rect x="50" y="24" width="10" height="6" rx="2" fill="#9575CD"/>
      {/* Spray head */}
      <rect x="32" y="12" width="14" height="16" rx="2" fill="#EDE7F6"/>
      {/* Label */}
      <rect x="22" y="40" width="12" height="12" rx="2" fill="white"/>
      {/* Sparkle on label */}
      <path d="M28 43L29 46L32 46L30 48L31 51L28 49L25 51L26 48L24 46L27 46L28 43Z" fill="#7E57C2"/>
    </svg>
  )
}

export function PantryIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Glass jar */}
      <rect x="12" y="18" width="40" height="42" rx="4" fill="#FAFAFA"/>
      <rect x="16" y="22" width="32" height="34" rx="2" fill="#F5F5F5"/>
      {/* Lid */}
      <rect x="10" y="10" width="44" height="10" rx="3" fill="#8D6E63"/>
      <rect x="14" y="13" width="36" height="4" rx="1" fill="#A1887F"/>
      {/* Contents - pasta/grains */}
      <rect x="18" y="34" width="28" height="20" rx="2" fill="#FFE0B2"/>
      <ellipse cx="24" cy="42" rx="4" ry="5" fill="#FFCC80" transform="rotate(-15 24 42)"/>
      <ellipse cx="32" cy="40" rx="4" ry="5" fill="#FFB74D" transform="rotate(10 32 40)"/>
      <ellipse cx="40" cy="44" rx="4" ry="5" fill="#FFCC80" transform="rotate(-20 40 44)"/>
      <ellipse cx="28" cy="50" rx="4" ry="4" fill="#FFB74D" transform="rotate(25 28 50)"/>
      <ellipse cx="36" cy="48" rx="4" ry="5" fill="#FFCC80" transform="rotate(-10 36 48)"/>
      {/* Glass highlight */}
      <rect x="18" y="24" width="4" height="24" rx="2" fill="white" opacity="0.4"/>
    </svg>
  )
}

export function DessertsIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cupcake wrapper */}
      <path d="M14 38L18 58H46L50 38H14Z" fill="#EC407A"/>
      <path d="M18 40L20 56H44L46 40H18Z" fill="#F48FB1"/>
      {/* Wrapper lines */}
      <path d="M22 42V54M28 41V55M34 41V55M40 42V54" stroke="#AD1457" strokeWidth="1.5" opacity="0.4"/>
      {/* Frosting swirl */}
      <ellipse cx="32" cy="34" rx="18" ry="8" fill="#FFF9C4"/>
      <ellipse cx="32" cy="28" rx="14" ry="7" fill="#FFFDE7"/>
      <ellipse cx="32" cy="22" rx="10" ry="6" fill="#FFF9C4"/>
      <ellipse cx="32" cy="17" rx="6" ry="4" fill="#FFFDE7"/>
      {/* Cherry on top */}
      <circle cx="32" cy="10" r="6" fill="#E91E63"/>
      <ellipse cx="30" cy="8" rx="2" ry="1.5" fill="#F48FB1"/>
      <path d="M32 5V10" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
      <path d="M32 5C32 5 36 3 38 5" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

export function PetsIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Dog ears */}
      <ellipse cx="14" cy="22" rx="10" ry="16" fill="#8D6E63" transform="rotate(-15 14 22)"/>
      <ellipse cx="50" cy="22" rx="10" ry="16" fill="#8D6E63" transform="rotate(15 50 22)"/>
      {/* Dog head */}
      <circle cx="32" cy="38" r="24" fill="#A1887F"/>
      <circle cx="32" cy="38" r="20" fill="#BCAAA4"/>
      {/* Snout */}
      <ellipse cx="32" cy="48" rx="12" ry="8" fill="#D7CCC8"/>
      {/* Eyes */}
      <circle cx="22" cy="34" r="6" fill="white"/>
      <circle cx="42" cy="34" r="6" fill="white"/>
      <circle cx="23" cy="35" r="4" fill="#3E2723"/>
      <circle cx="43" cy="35" r="4" fill="#3E2723"/>
      <circle cx="24" cy="34" r="1.5" fill="white"/>
      <circle cx="44" cy="34" r="1.5" fill="white"/>
      {/* Nose */}
      <ellipse cx="32" cy="46" rx="5" ry="4" fill="#5D4037"/>
      <ellipse cx="31" cy="45" rx="2" ry="1" fill="#795548"/>
      {/* Mouth */}
      <path d="M28 52C30 54 34 54 36 52" stroke="#5D4037" strokeWidth="2" strokeLinecap="round"/>
      <path d="M32 46V50" stroke="#5D4037" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function BeverageIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Coffee cup */}
      <path d="M10 20H48L42 56C42 58 38 60 28 60C18 60 14 58 14 56L10 20Z" fill="#FAFAFA"/>
      <path d="M14 24H44L40 54C40 56 36 58 28 58C20 58 16 56 16 54L14 24Z" fill="#F5F5F5"/>
      {/* Coffee */}
      <ellipse cx="28" cy="22" rx="18" ry="4" fill="#6D4C41"/>
      <ellipse cx="26" cy="21" rx="12" ry="2" fill="#8D6E63"/>
      {/* Cup sleeve */}
      <rect x="12" y="34" width="34" height="10" rx="1" fill="#8D6E63"/>
      {/* Handle */}
      <path d="M48 28C48 28 58 30 58 40C58 50 48 50 48 50" stroke="#E0E0E0" strokeWidth="6" strokeLinecap="round"/>
      <path d="M48 30C48 30 54 32 54 40C54 48 48 48 48 48" stroke="#FAFAFA" strokeWidth="3" strokeLinecap="round"/>
      {/* Steam */}
      <path d="M22 12C22 12 24 8 22 4" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round"/>
      <path d="M28 10C28 10 30 6 28 2" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round"/>
      <path d="M34 12C34 12 36 8 34 4" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function BabyIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Baby bottle */}
      <path d="M18 26H46L48 56C48 60 42 62 32 62C22 62 16 60 16 56L18 26Z" fill="#FAFAFA"/>
      <path d="M22 30H42L44 54C44 58 38 60 32 60C26 60 20 58 20 54L22 30Z" fill="#FFF9C4"/>
      {/* Neck */}
      <rect x="24" y="16" width="16" height="12" rx="2" fill="#FAFAFA"/>
      {/* Ring/collar */}
      <rect x="22" y="14" width="20" height="6" rx="2" fill="#64B5F6"/>
      {/* Nipple */}
      <path d="M28 14C28 10 30 6 32 6C34 6 36 10 36 14" fill="#FFCC80"/>
      <ellipse cx="32" cy="6" rx="3" ry="2" fill="#FFB74D"/>
      {/* Measurement marks */}
      <path d="M22 36H28" stroke="#90CAF9" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 44H26" stroke="#90CAF9" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 52H28" stroke="#90CAF9" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function HealthBeautyIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Lotion bottle */}
      <path d="M18 30H46L44 58C44 60 40 62 32 62C24 62 20 60 20 58L18 30Z" fill="#F8BBD9"/>
      <path d="M22 34H42L40 56C40 58 36 60 32 60C28 60 24 58 24 56L22 34Z" fill="#F48FB1"/>
      {/* Pump top */}
      <rect x="26" y="18" width="12" height="14" rx="2" fill="#FAFAFA"/>
      <rect x="28" y="8" width="8" height="12" rx="2" fill="#E0E0E0"/>
      {/* Pump nozzle */}
      <path d="M36 14H48C50 14 50 18 48 18H38" fill="#BDBDBD"/>
      {/* Label */}
      <rect x="26" y="40" width="12" height="12" rx="2" fill="white" opacity="0.9"/>
      {/* Heart on label */}
      <path d="M29 45C27 43 27 41 29 41C31 41 32 43 32 44C32 43 33 41 35 41C37 41 37 43 35 45C33 47 32 49 32 49C32 49 31 47 29 45Z" fill="#E91E63"/>
    </svg>
  )
}

export function OrganicIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Circle badge */}
      <circle cx="32" cy="32" r="28" fill="#E8F5E9"/>
      <circle cx="32" cy="32" r="26" stroke="#4CAF50" strokeWidth="4"/>
      {/* Leaf */}
      <path d="M32 12C32 12 16 24 16 40C16 52 24 56 32 56C40 56 48 52 48 40C48 24 32 12 32 12Z" fill="#66BB6A"/>
      <path d="M32 16C32 16 20 26 20 40C20 50 26 54 32 54C38 54 44 50 44 40C44 26 32 16 32 16Z" fill="#81C784"/>
      {/* Leaf veins */}
      <path d="M32 16V52" stroke="#43A047" strokeWidth="3" strokeLinecap="round"/>
      <path d="M24 30L32 36L40 30" stroke="#43A047" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M22 42L32 46L42 42" stroke="#43A047" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

// Icon mapping for easy access - comprehensive list with all variations
export const categoryIconComponents: Record<string, React.FC<{ className?: string }>> = {
  // Vegetables
  'vegetables': VegetablesIcon,
  'fruits-vegetables': VegetablesIcon,
  'fruits-&-vegetables': VegetablesIcon,
  'fresh-vegetables': VegetablesIcon,

  // Fruits
  'fresh-fruits': FruitsIcon,
  'fruits': FruitsIcon,

  // Dairy
  'dairy-eggs': DairyIcon,
  'dairy-&-eggs': DairyIcon,
  'dairy': DairyIcon,
  'eggs': DairyIcon,

  // Meat & Poultry
  'meat-poultry': MeatPoultryIcon,
  'meat-&-poultry': MeatPoultryIcon,
  'meat': MeatPoultryIcon,
  'poultry': MeatPoultryIcon,
  'chicken': MeatPoultryIcon,

  // Fish & Seafood
  'fish-seafood': FishSeafoodIcon,
  'fish-&-seafood': FishSeafoodIcon,
  'seafood': FishSeafoodIcon,
  'fish': FishSeafoodIcon,

  // Bakery
  'bakery': BakeryIcon,
  'bread': BakeryIcon,
  'baked-goods': BakeryIcon,

  // Frozen
  'frozen': FrozenIcon,
  'ice-cream': FrozenIcon,
  'frozen-foods': FrozenFoodsIcon,
  'frozen-food': FrozenFoodsIcon,

  // Beverages & Drinks
  'beverages': BeveragesIcon,
  'beverage': BeverageIcon,
  'drinks': DrinksIcon,
  'drinks-juice': DrinksIcon,
  'drinks-&-juice': DrinksIcon,
  'juice': DrinksIcon,
  'coffee': BeverageIcon,
  'tea': BeverageIcon,

  // Snacks
  'snacks-sweets': SnacksIcon,
  'snacks': SnacksIcon,
  'sweets': SnacksIcon,
  'chips': SnacksIcon,
  'crisps': SnacksIcon,

  // Pantry
  'pantry': PantryIcon,
  'pasta': PantryIcon,
  'rice': PantryIcon,
  'grains': PantryIcon,
  'canned-goods': PantryIcon,

  // Desserts
  'desserts': DessertsIcon,
  'dessert': DessertsIcon,
  'cakes': DessertsIcon,
  'pastries': DessertsIcon,

  // Pets
  'pets-animals': PetsIcon,
  'pets-&-animals': PetsIcon,
  'pets': PetsIcon,
  'pet-food': PetsIcon,

  // Household
  'household': HouseholdIcon,
  'cleaning': HouseholdIcon,
  'home-care': HouseholdIcon,

  // Health & Beauty
  'health-beauty': HealthBeautyIcon,
  'health-&-beauty': HealthBeautyIcon,
  'personal-care': HealthBeautyIcon,
  'beauty': HealthBeautyIcon,

  // Baby
  'baby': BabyIcon,
  'baby-products': BabyIcon,
  'baby-care': BabyIcon,

  // Organic
  'organic': OrganicIcon,
  'organic-foods': OrganicIcon,
  'natural': OrganicIcon,

  // Alcohol
  'alcohol': BeveragesIcon,
  'wine': BeveragesIcon,
  'beer': BeveragesIcon,
}

// Default icon for unknown categories
export function DefaultCategoryIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shopping bag */}
      <path d="M10 22H54L48 58H16L10 22Z" fill="#26A69A"/>
      <path d="M14 26H50L46 54H18L14 26Z" fill="#4DB6AC"/>
      {/* Handle */}
      <path d="M22 22C22 22 22 12 32 12C42 12 42 22 42 22" stroke="#00897B" strokeWidth="4" strokeLinecap="round" fill="none"/>
      {/* Plus icon */}
      <path d="M32 34V46M26 40H38" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  )
}
