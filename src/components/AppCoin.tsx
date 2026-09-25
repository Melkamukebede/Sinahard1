import React from 'react';

export interface AppCoinProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  xs: { width: 14, height: 14, fontSize: '9px' },
  sm: { width: 18, height: 18, fontSize: '11px' },
  md: { width: 22, height: 22, fontSize: '13px' },
  lg: { width: 28, height: 28, fontSize: '16px' },
  xl: { width: 38, height: 38, fontSize: '20px' },
};

export const AppCoin: React.FC<AppCoinProps> = ({
  size = 'md',
  className = '',
  animate = false,
}) => {
  const { width, height } = sizeMap[size];
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none inline-block drop-shadow-xs ${animate ? 'hover:rotate-12 transition-transform duration-300' : ''} ${className}`}
      aria-label="Sinahard Coin"
    >
      <defs>
        {/* Outer Rim Radiant Gradient: Gold with hint of Sinahard Cyan/Emerald */}
        <radialGradient
          id={`coin-rim-${uniqueId}`}
          cx="30%"
          cy="30%"
          r="70%"
          fx="30%"
          fy="30%"
        >
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="85%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </radialGradient>

        {/* Inner Face Radiant Gradient */}
        <linearGradient id={`coin-face-${uniqueId}`} x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        {/* Sinahard Emerald Glow border for subtle brand harmony */}
        <linearGradient id={`coin-accent-${uniqueId}`} x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#34d399" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
        </linearGradient>

        {/* Top Glint / Highlight */}
        <linearGradient id={`coin-glint-${uniqueId}`} x1="8" y1="4" x2="24" y2="12">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Outer Coin Base & Rim */}
      <circle cx="16" cy="16" r="15" fill={`url(#coin-rim-${uniqueId})`} />
      <circle cx="16" cy="16" r="15" stroke={`url(#coin-accent-${uniqueId})`} strokeWidth="1" />

      {/* Ribbed Gear Border Details */}
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke="#78350f"
        strokeWidth="0.8"
        strokeDasharray="2 1"
        strokeOpacity="0.6"
      />

      {/* Inner Recessed Face */}
      <circle cx="16" cy="16" r="11.5" fill={`url(#coin-face-${uniqueId})`} />
      <circle cx="16" cy="16" r="11.5" stroke="#fef08a" strokeWidth="0.7" strokeOpacity="0.7" />

      {/* Top Light Crescent Highlight */}
      <ellipse cx="16" cy="8" rx="8" ry="3.5" fill={`url(#coin-glint-${uniqueId})`} />

      {/* Center Sinahard "S" Emblem */}
      <path
        d="M19.2 11.2C18.4 10.4 17.2 10 15.8 10C13.4 10 11.8 11.4 11.8 13.2C11.8 15 13.2 15.9 15.2 16.4L16.2 16.6C17.6 17 18.4 17.6 18.4 18.7C18.4 20 17 21 15.2 21C13.6 21 12.3 20.3 11.4 19.3"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 3D Drop Shadow on the S */}
      <path
        d="M19.2 11.6C18.4 10.8 17.2 10.4 15.8 10.4C13.4 10.4 11.8 11.8 11.8 13.6C11.8 15.4 13.2 16.3 15.2 16.8L16.2 17C17.6 17.4 18.4 18 18.4 19.1C18.4 20.4 17 21.4 15.2 21.4C13.6 21.4 12.3 20.7 11.4 19.7"
        stroke="#78350f"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.45"
      />

      {/* Small Star / Dot Accents at 9 and 3 o'clock */}
      <circle cx="8" cy="16" r="0.9" fill="#fef08a" />
      <circle cx="24" cy="16" r="0.9" fill="#fef08a" />
    </svg>
  );
};
