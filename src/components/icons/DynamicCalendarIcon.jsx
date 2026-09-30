import React from 'react';

export default function DynamicCalendarIcon({ className = "w-24 h-24" }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="calGradHeader" x1="20" y1="20" x2="100" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0D9488" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
        <linearGradient id="calGradBody" x1="20" y1="40" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F0FDFA" stopOpacity="0.95" />
          <stop offset="1" stopColor="#CCFBF1" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id="calAccentBadge" x1="60" y1="65" x2="90" y2="95" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0D9488" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <filter id="calShadow" x="15" y="18" width="90" height="90" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0D9488" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* Pulsing background aura */}
      <circle cx="60" cy="60" r="48" fill="#14B8A6" opacity="0.12" className="animate-pulse" />

      <g filter="url(#calShadow)" className="transition-transform duration-500 ease-out hover:scale-105" style={{ transformOrigin: 'center' }}>
        {/* Calendar Body */}
        <rect x="24" y="26" width="72" height="70" rx="14" fill="white" />
        <rect x="24" y="26" width="72" height="70" rx="14" fill="url(#calGradBody)" />
        <rect x="24" y="26" width="72" height="70" rx="14" stroke="#99F6E4" strokeWidth="1.5" />

        {/* Calendar Header */}
        <path d="M 24 40 C 24 32.268 30.268 26 38 26 L 82 26 C 89.732 26 96 32.268 96 40 L 96 48 L 24 48 Z" fill="url(#calGradHeader)" />

        {/* Binder Rings */}
        <rect x="38" y="20" width="6" height="12" rx="3" fill="#115E59" />
        <rect x="76" y="20" width="6" height="12" rx="3" fill="#115E59" />
        <circle cx="41" cy="22" r="2" fill="#CCFBF1" />
        <circle cx="79" cy="22" r="2" fill="#CCFBF1" />

        {/* Calendar Grid Dots / Events */}
        {/* Row 1 */}
        <rect x="34" y="56" width="8" height="6" rx="2" fill="#14B8A6" opacity="0.7" />
        <rect x="47" y="56" width="8" height="6" rx="2" fill="#14B8A6" opacity="0.4" />
        <rect x="60" y="56" width="8" height="6" rx="2" fill="#14B8A6" opacity="0.4" />
        <rect x="73" y="56" width="13" height="6" rx="2" fill="#F59E0B" opacity="0.9" />

        {/* Row 2 */}
        <rect x="34" y="67" width="8" height="6" rx="2" fill="#14B8A6" opacity="0.4" />
        <rect x="47" y="67" width="14" height="6" rx="2" fill="#0D9488" opacity="0.9" />
        <rect x="66" y="67" width="8" height="6" rx="2" fill="#14B8A6" opacity="0.4" />
        <rect x="79" y="67" width="8" height="6" rx="2" fill="#14B8A6" opacity="0.4" />

        {/* Row 3 */}
        <rect x="34" y="78" width="8" height="6" rx="2" fill="#14B8A6" opacity="0.4" />
        <rect x="47" y="78" width="8" height="6" rx="2" fill="#14B8A6" opacity="0.4" />
        <rect x="60" y="78" width="12" height="6" rx="2" fill="#F59E0B" opacity="0.8" />
        <rect x="77" y="78" width="8" height="6" rx="2" fill="#14B8A6" opacity="0.4" />

        {/* Highlighted Agenda Star/Pill badge on bottom right */}
        <circle cx="78" cy="78" r="14" fill="url(#calAccentBadge)" />
        {/* Checkmark icon inside badge */}
        <path d="M 72 78 L 76 82 L 85 73" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
