import { useMemo } from 'react';
import { useWfoSchedule } from '../../hooks/useWfo';
import { useAuth } from '../../contexts/AuthContext';

function getFridayOfCurrentWeek() {
  const d = new Date();
  const day = d.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  
  // Distance to Friday (5). If Sunday (0), distance is -2. Else, 5 - day.
  const distance = day === 0 ? -2 : 5 - day;
  d.setDate(d.getDate() + distance);
  
  // Account for local time zone to avoid shifting to Thursday night in UTC
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

export default function FridayWfoWidget() {
  const { user } = useAuth();
  
  const fridayDateString = useMemo(() => getFridayOfCurrentWeek(), []);
  const { data: scheduleResponse, isLoading, isError } = useWfoSchedule(fridayDateString);

  const fridayDate = new Date(fridayDateString);
  const formattedDate = fridayDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-100 dark:bg-[var(--color-surface-muted)] rounded-2xl h-24 w-full mb-8"></div>
    );
  }

  if (isError) {
    return null;
  }

  const isConfigured = scheduleResponse?.isConfigured;
  const scheduleData = scheduleResponse?.data || [];
  
  let status = null;
  let StatusIcon = null;
  let bgClass = "bg-gray-50 dark:bg-[var(--color-surface-muted)] border border-gray-200 dark:border-gray-700/50";
  let textClass = "text-gray-500 dark:text-gray-400";
  let headingClass = "text-gray-700 dark:text-gray-200";
  let iconBgClass = "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400";
  let message = "Jadwal belum di input oleh admin.";

  if (isConfigured) {
    const mySchedule = scheduleData.find(s => s.id === user.id);
    if (mySchedule) {
      status = mySchedule.tipe;
      if (status === 'WFO') {
        bgClass = "bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30";
        textClass = "text-emerald-700 dark:text-emerald-400";
        headingClass = "text-emerald-900 dark:text-emerald-100";
        iconBgClass = "bg-emerald-100 text-emerald-600 dark:bg-emerald-800/40 dark:text-emerald-300";
        message = "Jadwal Anda Jumat ini adalah WFO (Work From Office).";
        StatusIcon = () => (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      } else {
        bgClass = "bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30";
        textClass = "text-indigo-700 dark:text-indigo-400";
        headingClass = "text-indigo-900 dark:text-indigo-100";
        iconBgClass = "bg-indigo-100 text-indigo-600 dark:bg-indigo-800/40 dark:text-indigo-300";
        message = "Jadwal Anda Jumat ini adalah WFH (Work From Home).";
        StatusIcon = () => (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      }
    }
  }

  return (
    <div className={`rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-300 ${bgClass}`}>
      <div className="flex items-start sm:items-center gap-4">
        <div className={`p-3 rounded-full shrink-0 ${iconBgClass}`}>
          {StatusIcon ? <StatusIcon /> : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        <div>
          <h3 className={`font-semibold ${headingClass}`}>
            Status Jumat Ini ({formattedDate})
          </h3>
          <p className={`text-sm mt-1 ${textClass}`}>
            {message}
          </p>
        </div>
      </div>
      {status === 'WFO' && (
        <div className="sm:shrink-0 text-sm font-bold tracking-widest text-emerald-700 bg-emerald-100/50 dark:bg-emerald-800/40 dark:text-emerald-300 px-5 py-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50 uppercase">
          WFO
        </div>
      )}
      {status === 'WFH' && (
        <div className="sm:shrink-0 text-sm font-bold tracking-widest text-indigo-700 bg-indigo-100/50 dark:bg-indigo-800/40 dark:text-indigo-300 px-5 py-2.5 rounded-xl border border-indigo-200/50 dark:border-indigo-700/50 uppercase">
          WFH
        </div>
      )}
      {!status && (
        <div className="sm:shrink-0 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800/50 dark:text-gray-400 px-4 py-2 rounded-xl border border-gray-200/50 dark:border-gray-700/50 uppercase">
          TBD
        </div>
      )}
    </div>
  );
}
