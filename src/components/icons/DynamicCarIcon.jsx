import React from 'react';

export default function DynamicCarIcon({ className = "w-24 h-24" }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="carGrad" x1="20" y1="30" x2="100" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E3A8A" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="lightGrad" x1="97" y1="60" x2="120" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE047" stopOpacity="0.8"/>
          <stop offset="1" stopColor="#FDE047" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="windowGrad" x1="35" y1="40" x2="72" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#93C5FD" stopOpacity="0.9"/>
          <stop offset="1" stopColor="#3B82F6" stopOpacity="0.5"/>
        </linearGradient>
      </defs>

      {/* Background glow circle */}
      <circle cx="60" cy="60" r="45" fill="#3B82F6" opacity="0.1" className="animate-pulse" />
      
      {/* Dynamic speed lines */}
      <g className="text-blue-300 opacity-60">
        <path d="M10 40 L30 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-[dash_2s_linear_infinite]" strokeDasharray="5 15" />
        <path d="M5 55 L20 55" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-[dash_1.5s_linear_infinite]" strokeDasharray="10 10" />
        <path d="M15 80 L45 80" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" className="animate-[dash_3s_linear_infinite]" strokeDasharray="8 12" />
        <path d="M85 85 L115 85" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" className="animate-[dash_1s_linear_infinite]" strokeDasharray="15 15" />
      </g>

      <g className="transform hover:-translate-y-2 transition-transform duration-500 ease-out">
        {/* Ground shadow */}
        <ellipse cx="60" cy="82" rx="42" ry="4" fill="#000000" opacity="0.15" />
        
        {/* Car Silhouette (Blue Gradient) */}
        <path d="M25 68 L22 58 C20 45 27 38 38 38 L58 38 C68 38 78 45 82 52 L95 56 C99 57 101 60 101 68 Z" fill="url(#carGrad)" />
        
        {/* Window */}
        <path d="M38 42 L56 42 C63 42 71 47 75 53 L35 53 C35 46 36 42 38 42 Z" fill="url(#windowGrad)" />
        
        {/* Door line */}
        <path d="M56 42 L56 68" stroke="#1E3A8A" strokeWidth="1.5" opacity="0.5" />
        
        {/* Headlight */}
        <path d="M95 58 L101 59 L101 64 L95 64 Z" fill="#FDE047" />
        <polygon points="101,59 120,45 120,78 101,64" fill="url(#lightGrad)" opacity="0.6"/>
        
        {/* Tail light */}
        <path d="M23 58 L20 58 L20 63 L24 63 Z" fill="#EF4444" />

        {/* Wheels */}
        <g className="animate-[spin_2s_linear_infinite]" style={{ transformOrigin: '38px 68px' }}>
          <circle cx="38" cy="68" r="11" fill="#0F172A" />
          <circle cx="38" cy="68" r="4" fill="#94A3B8" />
          <path d="M38 57 L38 64 M38 72 L38 79 M27 68 L34 68 M42 68 L49 68" stroke="#334155" strokeWidth="1.5" />
        </g>
        
        <g className="animate-[spin_2s_linear_infinite]" style={{ transformOrigin: '82px 68px' }}>
          <circle cx="82" cy="68" r="11" fill="#0F172A" />
          <circle cx="82" cy="68" r="4" fill="#94A3B8" />
          <path d="M82 57 L82 64 M82 72 L82 79 M71 68 L78 68 M86 68 L93 68" stroke="#334155" strokeWidth="1.5" />
        </g>
      </g>
    </svg>
  );
}
