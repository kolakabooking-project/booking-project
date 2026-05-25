import { Car, Building2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeLogo from '../components/ui/ThemeLogo';
import DynamicCarIcon from '../components/icons/DynamicCarIcon';
import DynamicRoomIcon from '../components/icons/DynamicRoomIcon';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { serviceApi } from '../lib/api';

export default function ServiceSelectorPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [serviceStatus, setServiceStatus] = useState({ kdoActive: true, roomActive: true });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await serviceApi.getStatus();
        if (res.data) setServiceStatus(res.data);
      } catch (err) {
        console.error('Failed to load service status:', err);
      }
    };
    fetchStatus();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      {/* Top Navbar */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center">
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
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>

      <div className="text-center mb-10 mt-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Selamat Datang, {user?.name?.split(' ')[0]}</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Silakan pilih layanan yang ingin Anda gunakan hari ini
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4">
        {/* KDO Card */}
        <button
          onClick={() => {
            if (!serviceStatus.kdoActive && !isAdmin) {
              toast.error('Layanan Booking KDO sedang nonaktif dan dalam perbaikan.');
              return;
            }
            navigate(isAdmin ? '/admin/dashboard' : '/user/dashboard');
          }}
          className="group relative flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-3xl border-2 border-transparent hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden text-left w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900"
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
            Masuk ke Layanan
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </button>

        {/* Room Card */}
        <button
          onClick={() => {
            if (!serviceStatus.roomActive && !isAdmin) {
              toast.error('Layanan Booking Ruangan sedang nonaktif dan dalam perbaikan.');
              return;
            }
            navigate(isAdmin ? '/admin/room/dashboard' : '/user/room/dashboard');
          }}
          className="group relative flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-3xl border-2 border-transparent hover:border-blue-500/50 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
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
            Masuk ke Layanan
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}
