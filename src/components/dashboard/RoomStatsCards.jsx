import React, { useState, useEffect } from 'react';
import { Building2, DoorOpen, Users } from 'lucide-react';
import { useRoomBooking } from '../../contexts/RoomBookingContext';
import { ROOM_STATUS } from '../../utils/constants';

// A helper for counting up animation
const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10);
    if (isNaN(end)) return;
    
    const duration = 1200; // ms
    const incrementTime = Math.max(16, Math.floor(duration / (end || 1)));
    
    const timer = setInterval(() => {
      start += 1;
      setDisplayValue(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <>{displayValue}</>;
};

export default function RoomStatsCards() {
  const { rooms } = useRoomBooking();
  const availableRooms = rooms.filter(r => r.status === ROOM_STATUS.AVAILABLE).length;
  const totalCapacity = rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);

  return (
    <div className="flex justify-center w-full mb-8 perspective-1000">
      <div className="relative w-full max-w-4xl group">
        {/* 
          ALIEN/HOLOGRAPHIC GLOW BEHIND THE PILL 
          We use an ambient animated gradient that shifts behind the main pill.
        */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-teal-400 to-amber-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-700 animate-pulse-slow mix-blend-multiply dark:mix-blend-screen" />
        
        {/* 
          THE CAPSULE (DYNAMIC ISLAND / TELEMETRY PILL)
          Extremely space-efficient, no bulky cards.
        */}
        <div className="relative flex items-center justify-between p-1.5 sm:p-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-full border border-white/60 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-transform duration-500 hover:scale-[1.01]">
        
        {/* Metric 1: Total Ruangan */}
        <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 py-2 sm:py-3 px-2 rounded-full hover:bg-white/50 dark:hover:bg-white/5 transition-colors cursor-default">
          <div className="relative flex items-center justify-center">
             <div className="absolute inset-0 bg-blue-400 rounded-full blur opacity-40" />
             <div className="relative flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
               <Building2 size={16} className="sm:w-5 sm:h-5" />
             </div>
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-xl sm:text-3xl font-black text-gray-800 dark:text-white leading-none tracking-tight">
              <AnimatedNumber value={rooms.length} />
            </span>
            <span className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 sm:mt-1">
              Total Ruang
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-10 sm:h-14 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent" />

        {/* Metric 2: Ruangan Tersedia */}
        <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 py-2 sm:py-3 px-2 rounded-full hover:bg-white/50 dark:hover:bg-white/5 transition-colors cursor-default">
          <div className="relative flex items-center justify-center">
             <div className="absolute inset-0 bg-emerald-400 rounded-full blur opacity-40" />
             <div className="relative flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md">
               <DoorOpen size={16} className="sm:w-5 sm:h-5" />
             </div>
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-xl sm:text-3xl font-black text-gray-800 dark:text-white leading-none tracking-tight">
              <AnimatedNumber value={availableRooms} />
            </span>
            <span className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 sm:mt-1">
              Tersedia
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-10 sm:h-14 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent" />

        {/* Metric 3: Total Kapasitas */}
        <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 py-2 sm:py-3 px-2 rounded-full hover:bg-white/50 dark:hover:bg-white/5 transition-colors cursor-default">
          <div className="relative flex items-center justify-center">
             <div className="absolute inset-0 bg-amber-400 rounded-full blur opacity-40" />
             <div className="relative flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
               <Users size={16} className="sm:w-5 sm:h-5" />
             </div>
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-xl sm:text-3xl font-black text-gray-800 dark:text-white leading-none tracking-tight">
              <AnimatedNumber value={totalCapacity} />
            </span>
            <span className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 sm:mt-1">
              Pax Duduk
            </span>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}
