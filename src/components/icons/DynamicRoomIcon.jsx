import React from 'react';

export default function DynamicRoomIcon({ className = "w-24 h-24" }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wallLeft" x1="20" y1="20" x2="60" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60A5FA" stopOpacity="0.3" />
          <stop offset="1" stopColor="#3B82F6" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="wallRight" x1="100" y1="20" x2="60" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" stopOpacity="0.2" />
          <stop offset="1" stopColor="#2563EB" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="floor" x1="20" y1="60" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" stopOpacity="0.15" />
          <stop offset="1" stopColor="#1E3A8A" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="tableTop" x1="45" y1="60" x2="75" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E40AF" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>

      {/* Background glow circle */}
      <circle cx="60" cy="60" r="45" fill="#3B82F6" opacity="0.1" className="animate-pulse" />

      <g className="transform hover:-translate-y-2 transition-transform duration-500 ease-out" style={{ transformOrigin: 'center' }}>
        
        {/* Isometric Room Structure */}
        <g stroke="#60A5FA" strokeWidth="0.5" strokeOpacity="0.3">
          {/* Floor */}
          <path d="M 20 70 L 60 95 L 100 70 L 60 45 Z" fill="url(#floor)" />
          {/* Left Wall */}
          <path d="M 20 70 L 60 45 L 60 5 L 20 30 Z" fill="url(#wallLeft)" />
          {/* Right Wall */}
          <path d="M 60 45 L 100 70 L 100 30 L 60 5 Z" fill="url(#wallRight)" />
        </g>
        
        {/* Isometric Door / Entrance on Right Wall */}
        <path d="M 70 39 L 85 48 L 85 70 L 70 61 Z" fill="#93C5FD" opacity="0.2" stroke="#93C5FD" strokeWidth="1" />
        {/* Door glowing light opening */}
        <path d="M 70 39 L 80 45 L 80 67 L 70 61 Z" fill="#F8FAFC" opacity="0.8" className="animate-pulse" style={{ filter: 'drop-shadow(0 0 8px #93C5FD)' }}/>
        
        {/* Meeting Table */}
        <path d="M 40 70 L 60 82.5 L 80 70 L 60 57.5 Z" fill="url(#tableTop)" />
        {/* Table Thickness */}
        <path d="M 40 70 L 60 82.5 L 60 86 L 40 73.5 Z" fill="#172554" />
        <path d="M 60 82.5 L 80 70 L 80 73.5 L 60 86 Z" fill="#1E3A8A" />
        
        {/* Table Base / Stand */}
        <path d="M 57 75 L 63 71.5 L 63 90 L 57 93.5 Z" fill="#0F172A" opacity="0.8" />
        
        {/* Floating Data / Bar Charts coming from the table */}
        <g className="animate-[float_3s_ease-in-out_infinite]">
          {/* Bar 1 */}
          <path d="M 50 62 L 53 63.8 L 53 50 L 50 48.2 Z" fill="#F59E0B" />
          <path d="M 53 63.8 L 56 62 L 56 48.2 L 53 50 Z" fill="#D97706" />
          <path d="M 50 48.2 L 53 50 L 56 48.2 L 53 46.4 Z" fill="#FCD34D" />
          
          {/* Bar 2 (Taller) */}
          <path d="M 60 62 L 63 63.8 L 63 40 L 60 38.2 Z" fill="#10B981" />
          <path d="M 63 63.8 L 66 62 L 66 38.2 L 63 40 Z" fill="#059669" />
          <path d="M 60 38.2 L 63 40 L 66 38.2 L 63 36.4 Z" fill="#34D399" />
        </g>
        
        {/* Large Screen on Left Wall */}
        <g transform="translate(0, 0)">
          <path d="M 30 35 L 52 21 L 52 45 L 30 59 Z" fill="#1E293B" stroke="#334155" strokeWidth="1" />
          {/* Screen Content (Glowing) */}
          <path d="M 32 37 L 50 25.5 L 50 43 L 32 54.5 Z" fill="#DBEAFE" className="animate-pulse" style={{ filter: 'drop-shadow(0 0 6px #60A5FA)' }} />
          {/* Chart lines on screen */}
          <path d="M 35 50 L 38 45 L 42 48 L 47 38" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-[dash_2s_linear_infinite]" strokeDasharray="2 4"/>
        </g>
        
        {/* Decorative Floating Spheres */}
        <circle cx="35" cy="25" r="3" fill="#60A5FA" className="animate-[bounce_2.5s_ease-in-out_infinite]" />
        <circle cx="85" cy="20" r="2.5" fill="#FDE047" className="animate-[bounce_3s_ease-in-out_infinite_reverse]" style={{ filter: 'drop-shadow(0 0 4px #FDE047)' }} />

      </g>
    </svg>
  );
}
