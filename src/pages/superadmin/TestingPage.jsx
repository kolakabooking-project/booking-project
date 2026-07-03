import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send, Loader2, User, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TestingPage() {
  const [users, setUsers] = useState([]);
  const [activeSubs, setActiveSubs] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchUsersAndSubs();
  }, []);

  const fetchUsersAndSubs = async () => {
    setIsLoading(true);
    try {
      const [usersRes, subsRes] = await Promise.all([
        fetch('/api/superadmin/users?limit=1000'),
        fetch('/api/push/subscriptions', { credentials: 'include' })
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.data?.users || data.data || []);
      }
      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setActiveSubs(subsData.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat daftar pegawai dan subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPush = async (overrideUserId) => {
    const targetId = typeof overrideUserId === 'string' ? overrideUserId : selectedUser;
    if (!targetId) {
      toast.error('Silakan pilih pegawai terlebih dahulu');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim notifikasi');
      }

      if (data.stats && (data.stats.total === 0 || data.stats.success === 0)) {
        toast.warning(data.message || 'Perhatian pada pengiriman notifikasi');
      } else {
        toast.success(data.message || 'Notifikasi uji coba berhasil dikirim!');
      }
      // Refresh list to remove any expired subscriptions detected
      fetchUsersAndSubs();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Terjadi kesalahan saat mengirim notifikasi');
    } finally {
      setIsSending(false);
    }
  };

  const getDeviceType = (endpoint) => {
    if (!endpoint) return 'Web Browser';
    if (endpoint.includes('google.com') || endpoint.includes('fcm')) return '🤖 Android / Chrome';
    if (endpoint.includes('apple.com')) return '🍏 iOS / Mac (Apple Push)';
    if (endpoint.includes('mozilla.com')) return '🦊 Firefox';
    return '🌐 Web Browser';
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold text-[color:var(--color-heading)]">Testing Notifications</h1>
        <p className="text-sm text-[color:var(--color-text-soft)]">
          Kirim notifikasi push dan in-app uji coba ke pegawai tertentu untuk memastikan sistem notifikasi berjalan dengan baik.
        </p>
      </div>

      {/* Card 1: Form Uji Coba */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border bg-[color:var(--color-surface-elevated)] p-6 shadow-sm"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-[color:var(--color-heading)]">Uji Coba Push Notification</h2>
            <p className="text-xs text-[color:var(--color-text-soft)]">Kirim notifikasi langsung ke layar HP pegawai (Web Push) & Toast In-App (Ably).</p>
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[color:var(--color-text-main)]">Target Pegawai</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)]" size={18} />
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm appearance-none bg-[color:var(--color-bg-shell)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
              >
                <option value="">-- Pilih Pegawai --</option>
                {users.map(user => {
                  const subCount = activeSubs.filter(s => s.userId === user.id).length;
                  return (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.nip || '-'}) {subCount > 0 ? `🟢 [${subCount} HP Terdaftar]` : `⚪ [0 HP]`}
                    </option>
                  );
                })}
              </select>
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="animate-spin text-[color:var(--color-text-soft)]" size={16} />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => handleTestPush()}
            disabled={!selectedUser || isSending}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:bg-purple-700 disabled:opacity-50"
          >
            {isSending ? (
              <><Loader2 className="animate-spin" size={16} /> Mengirim...</>
            ) : (
              <><Send size={16} /> Kirim Notifikasi Uji Coba</>
            )}
          </button>
        </div>
      </motion.div>

      {/* Card 2: Daftar Perangkat Aktif di Database */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border bg-[color:var(--color-surface-elevated)] p-6 shadow-sm"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
              <Smartphone size={20} />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-[color:var(--color-heading)]">Daftar Perangkat Aktif di Database Server</h2>
              <p className="text-xs text-[color:var(--color-text-soft)]">Total perangkat yang saat ini terdaftar dan siap menerima push notification.</p>
            </div>
          </div>
          <button
            onClick={fetchUsersAndSubs}
            disabled={isLoading}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-[color:var(--color-bg-shell)] hover:bg-[color:var(--color-border)] transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
          >
            Refresh Data
          </button>
        </div>

        {activeSubs.length === 0 ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div className="text-xs space-y-1 text-[color:var(--color-text-main)]">
              <p className="font-semibold text-amber-500">Belum Ada Perangkat Terdaftar di Database</p>
              <p>
                Jika Anda merasa sudah mengklik &quot;Aktifkan Notifikasi&quot; di HP Android atau iOS, kemungkinan saat itu Anda login dengan akun yang berbeda dari yang Anda tes di atas.
              </p>
              <p>
                <b>Solusi:</b> Buka PWA di HP Android/iOS Anda &rarr; Masuk ke menu <b>Akun</b> &rarr; Matikan lalu klik <b>Aktifkan Notifikasi</b> kembali agar token ter-upload ke database.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b text-[color:var(--color-text-soft)] text-xs font-semibold" style={{ borderColor: 'var(--color-border)' }}>
                  <th className="py-2.5 px-3">Pegawai / Akun</th>
                  <th className="py-2.5 px-3">Jenis Perangkat</th>
                  <th className="py-2.5 px-3">Waktu Daftar</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ divideColor: 'var(--color-border)' }}>
                {activeSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[color:var(--color-bg-shell)]/50 transition-colors">
                    <td className="py-3 px-3 font-medium text-[color:var(--color-text-main)]">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                        <div>
                          <div>{sub.userName || 'Unknown'}</div>
                          <div className="text-[10px] text-[color:var(--color-text-soft)] uppercase font-semibold">{sub.userRole}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-[color:var(--color-text-soft)]">
                      {getDeviceType(sub.endpoint)}
                    </td>
                    <td className="py-3 px-3 text-xs text-[color:var(--color-text-soft)]">
                      {new Date(sub.createdAt).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedUser(sub.userId);
                          handleTestPush(sub.userId);
                        }}
                        disabled={isSending}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors disabled:opacity-50"
                      >
                        <Send size={12} /> Tes Kirim
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
