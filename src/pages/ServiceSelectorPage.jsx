import { Car, Building2, LogOut, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeLogo from '../components/ui/ThemeLogo';
import DynamicCarIcon from '../components/icons/DynamicCarIcon';
import DynamicRoomIcon from '../components/icons/DynamicRoomIcon';
import DynamicTrackingIcon from '../components/icons/DynamicTrackingIcon';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { serviceApi } from '../lib/api';

export default function ServiceSelectorPage() {
  const navigate = useNavigate();
  const { user, activeRole, logout } = useAuth();
  const [checkingService, setCheckingService] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleServiceClick = async (serviceId, activeKey, adminPath, userPath, serviceName) => {
    setCheckingService(serviceId);
    try {
      const res = await serviceApi.getStatus();
      const status = res.data;
      if (!status[activeKey]) {
        toast.error(`Layanan ${serviceName} sedang nonaktif dan dalam perbaikan.`);
        setCheckingService(null);
        return;
      }
      navigate(isAdmin ? adminPath : userPath);
    } catch {
      // If API fails, fallback to context/realtime status or just let it pass to let ProtectedRoute handle it
      navigate(isAdmin ? adminPath : userPath);
    }
    setCheckingService(null);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
      setIsLoggingOut(false);
    }
  };

  const isAdmin = activeRole === 'admin' || activeRole === 'superadmin';

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 pt-32 md:pt-20">
      {/* Top Navbar */}
      <div className="absolute top-0 w-full px-6 pb-6 pt-[max(env(safe-area-inset-top,1.5rem),1.5rem)] flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <ThemeLogo className="h-8 md:h-10" />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pr-4 border-r border-gray-200 dark:border-gray-700">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.jabatan || 'Seksi Umum'}</p>
            </div>
            {user?.image ? (
              <img src={user.image} alt={user.name} className="h-10 w-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors disabled:opacity-50"
          >
            {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            <span className="hidden sm:inline">{isLoggingOut ? 'Keluar...' : 'Keluar'}</span>
          </button>
        </div>
      </div>

      <div className="text-center mb-10 mt-4 md:mt-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Selamat Datang, {user?.name?.split(' ')[0]}</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Silakan pilih layanan yang ingin Anda gunakan hari ini
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl px-4">
        {/* KDO Card */}
        <button
          onClick={() => handleServiceClick('kdo', 'kdoActive', '/admin/dashboard', '/user/dashboard', 'Booking KDO')}
          disabled={checkingService !== null}
          className={`group relative flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-3xl border-2 border-transparent shadow-sm transition-all duration-300 overflow-hidden text-left w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${checkingService === 'kdo' ? 'opacity-70 cursor-wait border-primary/50' : 'hover:border-primary/50 hover:shadow-xl'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 w-24 h-24 mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <DynamicCarIcon className="w-full h-full" />
          </div>
          <h3 className="relative z-10 text-2xl font-bold text-gray-900 dark:text-white mb-3">Booking Kendaraan</h3>
          <p className="relative z-10 text-gray-500 dark:text-gray-400 text-center text-sm md:text-base leading-relaxed">
            Ajukan peminjaman kendaraan dinas operasional dengan atau tanpa pengemudi untuk keperluan kedinasan.
          </p>
          <div className="relative z-10 mt-8 text-primary font-medium flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
            {checkingService === 'kdo' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Memeriksa Status...</>
            ) : (
              <>Masuk ke Layanan <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg></>
            )}
          </div>
        </button>

        {/* Room Card */}
        <button
          onClick={() => handleServiceClick('room', 'roomActive', '/admin/room/dashboard', '/user/room/dashboard', 'Booking Ruangan')}
          disabled={checkingService !== null}
          className={`group relative flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-3xl border-2 border-transparent shadow-sm transition-all duration-300 overflow-hidden text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${checkingService === 'room' ? 'opacity-70 cursor-wait border-blue-500/50' : 'hover:border-blue-500/50 hover:shadow-xl'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 w-24 h-24 mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <DynamicRoomIcon className="w-full h-full" />
          </div>
          <h3 className="relative z-10 text-2xl font-bold text-gray-900 dark:text-white mb-3">Booking Ruangan</h3>
          <p className="relative z-10 text-gray-500 dark:text-gray-400 text-center text-sm md:text-base leading-relaxed">
            Pesan ruang rapat atau fasilitas lainnya untuk kegiatan meeting, sosialisasi, atau acara khusus.
          </p>
          <div className="relative z-10 mt-8 text-blue-600 dark:text-blue-400 font-medium flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
            {checkingService === 'room' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Memeriksa Status...</>
            ) : (
              <>Masuk ke Layanan <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg></>
            )}
          </div>
        </button>

        {/* Tracking SPD Card */}
        <button
          onClick={() => handleServiceClick('spd', 'spdActive', '/admin/tracking/monitoring-spd', '/user/tracking/dashboard', 'Track SPD')}
          disabled={checkingService !== null}
          className={`group relative flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-3xl border-2 border-transparent shadow-sm transition-all duration-300 overflow-hidden text-left w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${checkingService === 'spd' ? 'opacity-70 cursor-wait border-emerald-500/50' : 'hover:border-emerald-500/50 hover:shadow-xl'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 w-24 h-24 mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <DynamicTrackingIcon className="w-full h-full" />
          </div>
          <h3 className="relative z-10 text-2xl font-bold text-gray-900 dark:text-white mb-3">Tracking SPD</h3>
          <p className="relative z-10 text-gray-500 dark:text-gray-400 text-center text-sm md:text-base leading-relaxed">
            Pantau status Surat Perjalanan Dinas, agenda surat tugas, dan rekap perjalanan dinas secara real-time.
          </p>
          <div className="relative z-10 mt-8 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
            {checkingService === 'spd' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Memeriksa Status...</>
            ) : (
              <>Masuk ke Layanan <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg></>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
