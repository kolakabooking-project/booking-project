import React, { useMemo } from 'react';
import { eachDayOfInterval, isSameDay, getHours, getDay } from 'date-fns';

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const START_HOUR = 6;
const END_HOUR = 18;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

export default function UtilizationHeatmap({ bookings = [], title = "Utilization Heatmap" }) {
  const heatmapData = useMemo(() => {
    // Initialize 7x13 matrix with 0s
    const matrix = Array(7).fill(0).map(() => Array(HOURS.length).fill(0));
    let maxCount = 0;

    const validBookings = bookings.filter(b => 
      b.status === 'Disetujui' || b.status === 'Berlangsung' || b.status === 'Selesai' || b.status === 'Selesai dengan Catatan'
    );

    validBookings.forEach((b) => {
      if (!b.startTime || !b.endTime) return;
      
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

      const daysCovered = eachDayOfInterval({ start, end });

      daysCovered.forEach((day) => {
        // getDay(): 0=Sun, 1=Mon ... 6=Sat
        // Map to 0=Mon, 6=Sun
        const dayOfWeek = (getDay(day) + 6) % 7;

        let hStart = START_HOUR;
        let hEnd = END_HOUR;

        if (isSameDay(day, start)) {
          hStart = Math.max(START_HOUR, getHours(start));
        }
        if (isSameDay(day, end)) {
          hEnd = Math.min(END_HOUR, getHours(end));
        }

        for (let h = hStart; h <= hEnd; h++) {
          const colIndex = h - START_HOUR;
          if (colIndex >= 0 && colIndex < HOURS.length) {
            matrix[dayOfWeek][colIndex] += 1;
            if (matrix[dayOfWeek][colIndex] > maxCount) {
              maxCount = matrix[dayOfWeek][colIndex];
            }
          }
        }
      });
    });

    return { matrix, maxCount };
  }, [bookings]);

  const { matrix, maxCount } = heatmapData;

  const getColorClass = (count) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-transparent';
    
    // Calculate intensity relative to maxCount
    const ratio = count / (maxCount || 1);
    if (ratio <= 0.25) return 'bg-green-200 border-green-300 text-green-800';
    if (ratio <= 0.5) return 'bg-green-400 border-green-500 text-green-900';
    if (ratio <= 0.75) return 'bg-green-600 border-green-700 text-white';
    return 'bg-green-800 border-green-900 text-white';
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm mb-6">
      <div className="flex flex-col mb-6">
        <h3 className="font-heading font-semibold text-lg text-gray-800 dark:text-gray-100">{title}</h3>
        <p className="text-sm text-gray-500">Distribusi Peminjaman Berdasarkan Waktu ({String(START_HOUR).padStart(2, '0')}:00 - {END_HOUR}:00)</p>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[700px]">
          {/* Header (Hours) */}
          <div className="flex ml-12 mb-2">
            {HOURS.map((hour) => (
              <div key={hour} className="flex-1 text-center text-xs font-semibold text-gray-400">
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Grid (Days x Hours) */}
          <div className="flex flex-col gap-1.5">
            {DAYS.map((day, rowIndex) => (
              <div key={day} className="flex items-center">
                <div className="w-12 text-xs font-semibold text-gray-500">{day}</div>
                <div className="flex flex-1 gap-1.5">
                  {HOURS.map((hour, colIndex) => {
                    const count = matrix[rowIndex][colIndex];
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={`flex-1 aspect-square rounded-md border ${getColorClass(count)} flex items-center justify-center text-[10px] font-bold transition-all duration-200 hover:scale-110 cursor-help relative group`}
                      >
                        {count > 0 ? count : ''}
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10 pointer-events-none">
                          {day} {String(hour).padStart(2, '0')}:00 - {count} Peminjaman
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gray-500">
        <span>Sedikit</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded-sm bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:border-gray-700"></div>
          <div className="w-4 h-4 rounded-sm bg-green-200 border border-green-300"></div>
          <div className="w-4 h-4 rounded-sm bg-green-400 border border-green-500"></div>
          <div className="w-4 h-4 rounded-sm bg-green-600 border border-green-700"></div>
          <div className="w-4 h-4 rounded-sm bg-green-800 border border-green-900"></div>
        </div>
        <span>Banyak</span>
      </div>
    </div>
  );
}
