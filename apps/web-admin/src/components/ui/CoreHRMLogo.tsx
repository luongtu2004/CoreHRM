'use client';

import React from 'react';

interface CoreHRMLogoProps {
  className?: string;
  variant?: 'full' | 'emblem' | 'horizontal';
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function CoreHRMLogo({
  className = '',
  variant = 'full',
  theme = 'dark',
  size = 'md'
}: CoreHRMLogoProps) {
  // Brand colors:
  // Caramel/Tan: #9C663C
  // Dark Brown: #4A2C11
  const caramelColor = '#9C663C';
  const darkBrownColor = '#4A2C11';

  // Styling based on theme
  const coreTextColor = theme === 'light' ? 'text-white' : 'text-[#4A2C11]';
  const hrmTextColor = theme === 'light' ? 'text-white/90' : 'text-[#9C663C]';
  const sinceTextColor = theme === 'light' ? 'text-white/60' : 'text-[#9C663C]/80';

  // Dimension mapping
  const emblemSizes = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const containerSizes = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-6'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl font-black',
    xl: 'text-4xl font-black'
  };

  const subtitleSizes = {
    sm: 'text-[7px] tracking-[0.2em]',
    md: 'text-[9px] tracking-[0.3em] font-semibold uppercase',
    lg: 'text-xs tracking-[0.35em] font-bold uppercase',
    xl: 'text-sm tracking-[0.4em] font-black uppercase'
  };

  // Re-designed, highly premium and geometrically perfect vector emblem
  const Emblem = (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${emblemSizes[size]} shrink-0 drop-shadow-sm transition-all duration-300 hover:scale-105`}
    >
      {/* Outer Card/Shield Shape: Left Half (Caramel) */}
      <path
        d="M 50 16
           C 28 16, 22 26, 22 50
           C 22 74, 28 84, 50 84
           L 50 72
           C 35 72, 34 64, 34 50
           C 34 36, 35 28, 50 28
           Z"
        fill={caramelColor}
      />

      {/* Outer Card/Shield Shape: Right Half (Dark Brown) */}
      <path
        d="M 50 16
           L 50 28
           C 65 28, 66 36, 66 50
           C 66 64, 65 72, 50 72
           L 50 84
           C 72 84, 78 74, 78 50
           C 78 26, 72 16, 50 16
           Z"
        fill={darkBrownColor}
      />

      {/* White Document/Folder detail on the left */}
      <rect
        x="34"
        y="48"
        width="13"
        height="18"
        rx="2"
        fill="#FFFFFF"
        opacity="0.95"
      />

      {/* Folded corner detail on the white document */}
      <path
        d="M 42 48
           L 47 48
           L 47 53
           Z"
        fill="#E2E8F0"
      />

      {/* Stylized Executive - Circular Head */}
      <circle cx="50" cy="34" r="8" fill={darkBrownColor} />

      {/* Stylized Executive - White V-Neck Collar & Shoulders */}
      <path
        d="M 37 66
           L 44 48
           L 50 58
           L 56 48
           L 63 66
           Z"
        fill="#FFFFFF"
      />

      {/* Stylized Executive - Tie (Dark Brown) */}
      <path
        d="M 48.5 53.5
           L 51.5 53.5
           L 52.5 61.5
           L 50 65
           L 47.5 61.5
           Z"
        fill={darkBrownColor}
      />
    </svg>
  );

  if (variant === 'emblem') {
    return Emblem;
  }

  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center ${containerSizes[size]} ${className}`}>
        {Emblem}
        <div className="flex flex-col justify-center">
          <div className="flex items-center">
            <span className={`${coreTextColor} ${textSizes[size]} font-black tracking-tight`}>
              CORE
            </span>
            <span className={`${hrmTextColor} ${textSizes[size]} font-light tracking-tight ml-0.5`}>
              HRM
            </span>
          </div>
          <span className={`${sinceTextColor} ${subtitleSizes[size]} mt-0.5 font-bold leading-none`}>
            SINCE 2026
          </span>
        </div>
      </div>
    );
  }

  // Full stacked logo (like the design share page)
  return (
    <div className={`flex flex-col items-center justify-center text-center ${containerSizes[size]} ${className}`}>
      {Emblem}
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center">
          <span className={`${coreTextColor} ${textSizes[size]} font-black tracking-tight`}>
            CORE
          </span>
          <span className={`${hrmTextColor} ${textSizes[size]} font-light tracking-tight ml-0.5`}>
            HRM
          </span>
        </div>
        <span className={`${sinceTextColor} ${subtitleSizes[size]} mt-1 font-bold leading-none`}>
          SINCE 2026
        </span>
      </div>
    </div>
  );
}
