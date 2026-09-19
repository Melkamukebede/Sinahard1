import React from 'react';

interface SinahardLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  badge?: string;
  idSuffix?: string;
}

export const SinahardLogo: React.FC<SinahardLogoProps> = ({
  size = 'md',
  className = '',
  showWordmark = false,
  wordmarkClassName = '',
  badge = 'Pro',
  idSuffix = 'main',
}) => {
  const sizeMap = {
    xs: 'w-5 h-5',
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20',
  };

  const dimClass = sizeMap[size] || sizeMap.md;
  const gradSky = `sinahard-sky-${idSuffix}`;
  const gradDark = `sinahard-dark-${idSuffix}`;
  const gradRibbonA = `sinahard-ribbon-a-${idSuffix}`;
  const gradRibbonB = `sinahard-ribbon-b-${idSuffix}`;
  const gradGlow = `sinahard-glow-${idSuffix}`;
  const gradBorder = `sinahard-border-${idSuffix}`;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`relative ${dimClass} shrink-0 rounded-2xl p-[1px] transition-transform duration-300 group-hover:scale-105 shadow-sm`}
        style={{
          background: 'linear-gradient(135deg, rgba(161, 191, 210, 0.6) 0%, rgba(89, 128, 154, 0.3) 50%, rgba(23, 44, 74, 0.5) 100%)',
        }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full rounded-[15px] overflow-hidden drop-shadow-xs"
        >
          <defs>
            {/* Atmospheric Background Palette: Mirroring the app's light & dark background gradients */}
            <linearGradient id={gradSky} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#59809a" />
              <stop offset="35%" stopColor="#769cb3" />
              <stop offset="70%" stopColor="#a1bfd2" />
              <stop offset="100%" stopColor="#d2e2ec" />
            </linearGradient>

            {/* Dark Mode Oceanic Core (Matches radial-gradient in html.dark body) */}
            <radialGradient id={gradDark} cx="50%" cy="15%" r="85%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="35%" stopColor="#172c4a" />
              <stop offset="70%" stopColor="#0d1a2d" />
              <stop offset="100%" stopColor="#08101d" />
            </radialGradient>

            {/* Glowing Celestial Horizon Ambient Light */}
            <radialGradient id={gradGlow} cx="50%" cy="0%" r="65%">
              <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#7dd3fc" stopOpacity="0.45" />
              <stop offset="85%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>

            {/* Primary Ribbon Gradient (S-Curve Upper) */}
            <linearGradient id={gradRibbonA} x1="0%" y1="10%" x2="100%" y2="90%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#e0f2fe" />
              <stop offset="80%" stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>

            {/* Secondary Ribbon Gradient (S-Curve Lower with Oceanic Accent) */}
            <linearGradient id={gradRibbonB} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="75%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            {/* Perimeter Highlight Border */}
            <linearGradient id={gradBorder} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
              <stop offset="50%" stopColor="rgba(161, 191, 210, 0.4)" />
              <stop offset="100%" stopColor="rgba(23, 44, 74, 0.6)" />
            </linearGradient>
          </defs>

          {/* Background Canvas: Deep Oceanic Base */}
          <rect width="100" height="100" rx="20" fill={`url(#${gradDark})`} />

          {/* Layered Atmospheric Horizons (Echoing the app's background linear steps) */}
          <path
            d="M-10 42 Q 50 24 110 42 L 110 100 L -10 100 Z"
            fill="url(#sinahard-sky-ambient)"
            fillOpacity="0.25"
          />
          <path
            d="M-10 65 Q 50 48 110 65 L 110 100 L -10 100 Z"
            fill="#172c4a"
            fillOpacity="0.45"
          />

          {/* Atmospheric Horizon Waves */}
          <path
            d="M-5 46 C 30 36, 70 54, 105 44"
            stroke="rgba(224, 242, 254, 0.25)"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M-5 68 C 30 58, 70 76, 105 66"
            stroke="rgba(147, 197, 253, 0.2)"
            strokeWidth="1.2"
            fill="none"
          />

          {/* Ambient Celestial Glow Orb at top center */}
          <circle cx="50" cy="8" r="34" fill={`url(#${gradGlow})`} />

          {/* Central Logo Emblem: The Advanced 'Sinahard' S-Crest */}
          {/* Upper Ribbon of 'S' flowing from top-right downwards */}
          <path
            d="M68 25 C68 21 64 18 57 18 C46 18 35 24 35 34 C35 44 45 48 57 51 C69 54 75 60 75 70 C75 82 62 86 49 86 C37 86 28 81 27 75"
            stroke={`url(#${gradRibbonA})`}
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Layered Interlocking High-Tech Prism Accent Ribbon */}
          <path
            d="M33 37 C37 32 44 28 54 28 C64 28 67 34 65 39 C62 44 54 47 45 50 C36 53 31 59 31 68 C31 73 34 78 39 81"
            stroke={`url(#${gradRibbonB})`}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.85"
          />

          {/* Precision Academic Star / Diamond Sparkle at Apex (Academic Mastery) */}
          <path
            d="M72 16 L74.5 22 L80.5 24.5 L74.5 27 L72 33 L69.5 27 L63.5 24.5 L69.5 22 Z"
            fill="#ffffff"
            className="drop-shadow-sm"
          />
          <circle cx="72" cy="24.5" r="1.5" fill="#38bdf8" />

          {/* Delicate Accent Node at lower loop */}
          <circle cx="28" cy="74" r="2" fill="#bae6fd" />

          {/* Inner Specular Rim */}
          <rect
            x="2.5"
            y="2.5"
            width="95"
            height="95"
            rx="18"
            stroke={`url(#${gradBorder})`}
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </div>

      {/* Wordmark (Optional) */}
      {showWordmark && (
        <div className={`flex flex-col ${wordmarkClassName}`}>
          <div className="flex items-center gap-1.5">
            <span className="font-['Outfit',sans-serif] font-bold text-lg sm:text-xl tracking-tight text-zinc-900 dark:text-white">
              Sinahard
            </span>
            {badge && (
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700">
                {badge}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
