import React from 'react';

export default function DynamicTrackingIcon({ className = "w-24 h-24" }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="trackDocGrad" x1="30" y1="15" x2="90" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#065F46" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="trackPinGrad" x1="75" y1="20" x2="95" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="1" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id="trackRouteGrad" x1="60" y1="85" x2="100" y2="85" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" stopOpacity="0.8"/>
          <stop offset="1" stopColor="#10B981" stopOpacity="0.2"/>
        </linearGradient>
      </defs>

      {/* Background glow circle */}
      <circle cx="60" cy="60" r="45" fill="#10B981" opacity="0.08" className="animate-pulse" />

      {/* Animated dots — route points */}
      <g className="text-emerald-400 opacity-50">
        <circle cx="85" cy="88" r="2" fill="currentColor" className="animate-[ping_3s_ease-in-out_infinite]" />
        <circle cx="100" cy="75" r="1.5" fill="currentColor" className="animate-[ping_2s_ease-in-out_infinite_0.5s]" />
        <circle cx="95" cy="95" r="1.5" fill="currentColor" className="animate-[ping_2.5s_ease-in-out_infinite_1s]" />
      </g>

      <g className="transform hover:-translate-y-2 transition-transform duration-500 ease-out">
        {/* Ground shadow */}
        <ellipse cx="55" cy="105" rx="35" ry="4" fill="#000000" opacity="0.1" />

        {/* Document body */}
        <rect x="25" y="18" width="50" height="68" rx="4" fill="url(#trackDocGrad)" />

        {/* Document fold */}
        <path d="M65 18 L75 18 L75 28 L65 28 Z" fill="#047857" opacity="0.6" />
        <path d="M65 18 L75 28 L65 28 Z" fill="#A7F3D0" opacity="0.3" />

        {/* Document lines — text */}
        <rect x="33" y="35" width="30" height="3" rx="1.5" fill="white" opacity="0.6" />
        <rect x="33" y="43" width="24" height="3" rx="1.5" fill="white" opacity="0.4" />
        <rect x="33" y="51" width="28" height="3" rx="1.5" fill="white" opacity="0.4" />
        <rect x="33" y="59" width="20" height="3" rx="1.5" fill="white" opacity="0.3" />

        {/* Checkmark circle — SPD verified */}
        <circle cx="42" cy="73" r="6" fill="#A7F3D0" />
        <path d="M39 73 L41 75 L46 70" stroke="#065F46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Location pin */}
        <g>
          <path d="M85 25 C85 25 75 25 75 35 C75 45 85 55 85 55 C85 55 95 45 95 35 C95 25 85 25 85 25 Z" fill="url(#trackPinGrad)" />
          <circle cx="85" cy="35" r="4" fill="white" opacity="0.9" />
          {/* Pin pulse ring */}
          <circle cx="85" cy="35" r="12" stroke="#F59E0B" strokeWidth="1.5" fill="none" opacity="0.3" className="animate-[ping_2s_ease-in-out_infinite]" />
        </g>

        {/* Route path — dashed line from doc to pin */}
        <path d="M70 70 Q 85 65, 90 55 Q 95 45, 85 55" stroke="url(#trackRouteGrad)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" className="animate-[dash_3s_linear_infinite]" />

        {/* Small airplane icon on route */}
        <g style={{ transformOrigin: '80px 62px' }}>
          <path d="M78 62 L82 60 L82 64 Z" fill="#10B981" opacity="0.8" />
        </g>
      </g>
    </svg>
  );
}
