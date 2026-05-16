import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import Button from '../../components/ui/Button';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!nip || !password) {
      setError('Silakan isi NIP dan password.');
      return;
    }
    setLoading(true);
    const result = await login(nip, password);
    setLoading(false);

    if (result.success) {
      navigate(result.role === 'admin' ? '/admin/dashboard' : '/user/dashboard', { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <AuthLayout>
      <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border p-5 sm:p-7 lg:p-9 shadow-[var(--shadow-card-hover)] backdrop-blur-xl" style={{ borderColor: 'var(--color-border)', background: 'color-mix(in srgb, var(--color-surface-elevated) 94%, transparent)' }}>
        <div
          className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(135deg,rgba(33,44,95,0.08),rgba(255,201,27,0.12))] dark:bg-[linear-gradient(135deg,rgba(142,164,255,0.12),rgba(255,201,27,0.1))]"
          style={{ maskImage: 'linear-gradient(to bottom, black, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)' }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[clamp(2.4rem,3vw,3.35rem)] leading-none font-heading font-extrabold tracking-tight text-[color:var(--color-heading)]">
                LOGIN
              </h2>
            </div>
            <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-djp-blue text-white shadow-lg shadow-djp-blue/20 sm:flex">
              <KeyRound size={22} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative z-10 mt-8 flex flex-col">
            {error && (
              <div className="mb-6 rounded-2xl border border-danger/20 bg-danger-light/80 px-4 py-3 text-sm text-danger animate-fade-in">
                {error}
              </div>
            )}

            <div className="flex flex-col">
              <label htmlFor="nip" className="form-label">
                NIP
              </label>
              <input
                id="nip"
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                className="form-control px-5 py-3.5"
                placeholder="Masukkan NIP"
                autoComplete="username"
              />
            </div>

            <div className="flex flex-col mt-6">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control px-5 py-3.5 pr-12"
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)] transition-colors hover:text-[color:var(--color-text-muted)]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/*<div className="mt-4 rounded-2xl border border-djp-yellow/20 bg-djp-yellow/10 px-4 py-3 text-sm leading-6 text-[color:var(--color-text-muted)]">
              Demo: gunakan NIP `198002021002 / admin123` untuk admin atau `198001011001 / user1234` untuk pegawai.
            </div>*/}

            <div className="pt-2 mt-8">
              <Button type="submit" loading={loading} size="lg" className="w-full">
                Masuk
              </Button>
            </div>
          </form>

          <div className="relative z-10 mt-8 text-center">
            <p className="text-[10px] font-heading font-bold uppercase tracking-[0.32em] text-[color:var(--color-text-soft)]">
              © 2026 KPP PRATAMA KOLAKA V1.0.0
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
