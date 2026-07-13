import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import { Eye, EyeOff, Sun, Moon, User, Lock, ArrowRight, Info } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import AboutAppModal from '../../components/settings/AboutAppModal';

export default function LoginPage() {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDev, setShowDev] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const handleMouseEnter = () => {
    if (window.matchMedia('(hover: hover)').matches) {
      setShowDev(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.matchMedia('(hover: hover)').matches) {
      setShowDev(false);
    }
  };

  const handleClick = () => {
    setShowDev((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(nip, password);
      if (result.success) {
        if (result.role === 'superadmin') {
          navigate('/superadmin/dashboard', { replace: true });
        } else {
          navigate('/select-service', { replace: true });
        }
      } else {
        setError(result.error || 'NIP atau password salah.');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat masuk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="relative group transition-transform duration-200 ease-out">
        {/* Outer Card Hover Glow Effect */}
        <div
          className="absolute -inset-[1px] rounded-[1.75rem] opacity-35 group-hover:opacity-80 transition-opacity duration-700 pointer-events-none"
          style={{ boxShadow: '0 0 25px 4px rgba(39,60,102,0.25), 0 0 15px 2px rgba(245,158,11,0.1)' }}
        />

        {/* Traveling Light Beams Container */}
        <div className="absolute -inset-[1px] rounded-[1.75rem] overflow-hidden pointer-events-none opacity-60 dark:opacity-100 transition-opacity duration-700">
          <div className="absolute top-0 left-0 h-[2.5px] w-[55%] bg-gradient-to-r from-transparent via-white to-transparent animate-beam-top" />
          <div className="absolute top-0 right-0 h-[55%] w-[2.5px] bg-gradient-to-b from-transparent via-white to-transparent animate-beam-right" />
          <div className="absolute bottom-0 right-0 h-[2.5px] w-[55%] bg-gradient-to-r from-transparent via-white to-transparent animate-beam-bottom" />
          <div className="absolute bottom-0 left-0 h-[55%] w-[2.5px] bg-gradient-to-b from-transparent via-white to-transparent animate-beam-left" />

          {/* Subtle corner glow spots */}
          <div className="absolute top-0 left-0 h-[6px] w-[6px] rounded-full bg-white/60 blur-[1px]" />
          <div className="absolute top-0 right-0 h-[8px] w-[8px] rounded-full bg-amber-300/70 blur-[1.5px]" />
          <div className="absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full bg-white/70 blur-[1.5px]" />
          <div className="absolute bottom-0 left-0 h-[6px] w-[6px] rounded-full bg-blue-300/60 blur-[1px]" />
        </div>

        {/* Card Border Gradient Subtlety */}
        <div className="absolute -inset-[0.5px] rounded-[1.75rem] bg-gradient-to-br from-white/40 via-white/10 to-white/20 dark:from-white/20 dark:via-white/5 dark:to-white/10 opacity-70 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />

        {/* Glass Card Main Body */}
        <div className="relative bg-white/85 dark:bg-slate-950/75 backdrop-blur-xl rounded-3xl sm:rounded-[1.75rem] p-6 sm:p-9 border border-slate-200/80 dark:border-white/[0.12] shadow-[0_25px_60px_-15px_rgba(39,60,102,0.18)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-700 ease-in-out">
          {/* Subtle card inner grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(135deg, currentColor 0.5px, transparent 0.5px), linear-gradient(45deg, currentColor 0.5px, transparent 0.5px)',
              backgroundSize: '32px 32px'
            }}
          />

          {/* Top-Right Controls: About App & Theme Toggle */}
          <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              aria-label="Tentang Aplikasi Bookolaka"
              className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-500 bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300/90 dark:hover:bg-white/20 text-slate-700 dark:text-white/90 border border-slate-300/80 dark:border-white/15 shadow-sm hover:scale-105 active:scale-95 focus:outline-none"
            >
              <Info className="w-3.5 h-3.5 text-blue-600 dark:text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
              <span className="text-xs font-bold tracking-wide">Tentang</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Tema Siang/Malam"
              className="group relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-500 bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300/90 dark:hover:bg-white/20 text-slate-700 dark:text-white/90 border border-slate-300/80 dark:border-white/15 shadow-sm hover:scale-110 active:scale-95 focus:outline-none"
            >
              {isDark ? (
                <Moon className="w-4 h-4 text-blue-200 transition-transform duration-500 group-hover:-rotate-12" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500 transition-transform duration-500 group-hover:rotate-45" />
              )}
            </button>
          </div>

          {/* Card Title Header */}
          <div className="relative z-10 pr-10 mb-5 sm:mb-7">
            <h2 className="text-[clamp(1.85rem,6vw,2.75rem)] leading-none font-heading font-extrabold tracking-tight text-[#273c66] dark:text-white transition-colors duration-700">
              LOGIN
            </h2>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-500/15 backdrop-blur-md p-3.5 border border-red-500/30 shadow-lg animate-fade-in relative z-10">
              <div className="text-sm font-medium text-red-800 dark:text-red-200 leading-snug">
                {error}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div className="space-y-3.5">
              {/* NIP Input */}
              <div className="flex flex-col">
                <label htmlFor="nip" className="form-label text-slate-600 dark:text-white/70">
                  NIP
                </label>
                <div className="group/input relative transition-transform duration-200 focus-within:scale-[1.01]">
                  <div className="absolute -inset-[0.5px] bg-gradient-to-r from-blue-500/20 via-blue-400/35 to-blue-500/20 dark:from-white/15 dark:via-blue-400/25 dark:to-white/15 rounded-xl opacity-0 group-focus-within/input:opacity-100 transition-all duration-300 pointer-events-none" />
                  <div className="relative flex items-center overflow-hidden rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-300/80 dark:border-white/10 group-focus-within/input:border-[#273c66] dark:group-focus-within/input:border-white/35 transition-all duration-500">
                    <User className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-white/40 group-focus-within/input:text-[#273c66] dark:group-focus-within/input:text-white transition-colors duration-300 pointer-events-none" />
                    <input
                      id="nip"
                      type="text"
                      required
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                      placeholder="Masukkan NIP"
                      autoComplete="username"
                      className="w-full bg-transparent border-none focus:ring-0 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 h-11 transition-all duration-500 pl-10 pr-4 text-sm font-medium outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col pt-1">
                <label htmlFor="password" className="form-label text-slate-600 dark:text-white/70">
                  Password
                </label>
                <div className="group/input relative transition-transform duration-200 focus-within:scale-[1.01]">
                  <div className="absolute -inset-[0.5px] bg-gradient-to-r from-blue-500/20 via-blue-400/35 to-blue-500/20 dark:from-white/15 dark:via-blue-400/25 dark:to-white/15 rounded-xl opacity-0 group-focus-within/input:opacity-100 transition-all duration-300 pointer-events-none" />
                  <div className="relative flex items-center overflow-hidden rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-300/80 dark:border-white/10 group-focus-within/input:border-[#273c66] dark:group-focus-within/input:border-white/35 transition-all duration-500">
                    <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-white/40 group-focus-within/input:text-[#273c66] dark:group-focus-within/input:text-white transition-colors duration-300 pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      autoComplete="current-password"
                      className="w-full bg-transparent border-none focus:ring-0 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 h-11 transition-all duration-500 pl-10 pr-11 text-sm font-medium outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3 p-1 rounded-md text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white transition-colors duration-300 flex items-center justify-center focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full relative group/button overflow-hidden rounded-xl h-11 transition-all duration-300 hover:scale-[1.015] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-75 disabled:pointer-events-none"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 via-amber-400/25 to-blue-600/30 rounded-xl blur-md opacity-0 group-hover/button:opacity-80 transition-opacity duration-300" />
                <div className="relative w-full h-full bg-[#273c66] dark:bg-white text-white dark:text-slate-950 font-semibold rounded-xl flex items-center justify-center shadow-lg overflow-hidden transition-colors duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/60 to-transparent animate-shimmer pointer-events-none" />
                  <span className="relative z-10 flex items-center justify-center gap-1.5 text-sm font-bold tracking-wide">
                    {loading ? 'Memproses...' : 'Masuk'}
                    {!loading && <ArrowRight className="w-4 h-4 group-hover/button:translate-x-1 transition-transform duration-300" />}
                  </span>
                </div>
              </button>
            </div>
          </form>

          {/* Footer Copyright */}
          <div
            className="relative z-10 mt-5 sm:mt-7 text-center select-none cursor-pointer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
          >
            <p className="text-[10px] font-heading font-extrabold uppercase tracking-[0.18em] sm:tracking-[0.32em] text-slate-900 dark:text-white/85 transition-colors hover:text-black dark:hover:text-white inline-block py-1 px-2 rounded-lg max-w-full break-words drop-shadow-sm">
              © 2026 KPP PRATAMA KOLAKA V1.0.0
            </p>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                showDev ? 'max-h-12 opacity-100 mt-1.5' : 'max-h-0 opacity-0 mt-0'
              }`}
            >
              <p className="text-[11px] font-semibold text-slate-900 dark:text-white/75 dark:[text-shadow:_0_1px_8px_rgba(0,0,0,0.95)]">
                Dikembangkan oleh{' '}
                <span className="font-extrabold text-black dark:text-white">Ahmad Fikri Rafiuddin</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <AboutAppModal
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
        showProcessSteps={true}
        accentColor="djp-blue"
        role="login"
      />
    </AuthLayout>
  );
}
