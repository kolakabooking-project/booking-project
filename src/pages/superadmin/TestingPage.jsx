import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

export default function TestingPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/superadmin/users?limit=1000');
      if (!res.ok) throw new Error('Gagal mengambil data pegawai');
      const data = await res.json();
      setUsers(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat daftar pegawai');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPush = async () => {
    if (!selectedUser) {
      toast.error('Silakan pilih pegawai terlebih dahulu');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mengirim notifikasi');
      }

      toast.success('Notifikasi uji coba berhasil dikirim!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Terjadi kesalahan saat mengirim notifikasi');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold text-[color:var(--color-heading)]">Testing Notifications</h1>
        <p className="text-sm text-[color:var(--color-text-soft)]">
          Kirim notifikasi push dan in-app uji coba ke pegawai tertentu untuk memastikan sistem notifikasi berjalan dengan baik.
        </p>
      </div>

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
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.nip || '-'})
                  </option>
                ))}
              </select>
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="animate-spin text-[color:var(--color-text-soft)]" size={16} />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleTestPush}
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
    </div>
  );
}
