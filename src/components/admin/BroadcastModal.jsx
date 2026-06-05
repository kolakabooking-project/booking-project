import { useState } from 'react';
import { Send, Megaphone } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { pushApi } from '../../lib/api';
import { toast } from 'react-hot-toast';

export default function BroadcastModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ title: '', body: '', url: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) {
      toast.error('Judul dan isi pesan tidak boleh kosong');
      return;
    }

    setLoading(true);
    try {
      const response = await pushApi.broadcast(form);
      if (response.success) {
        toast.success(response.message || 'Broadcast berhasil dimulai!');
        setForm({ title: '', body: '', url: '' });
        onClose();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Gagal mengirim broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kirim Broadcast Notifikasi" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex justify-center mb-4 mt-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-djp-blue/10">
            <Megaphone size={24} className="text-djp-blue" />
          </div>
        </div>

        <div>
          <label htmlFor="broadcast-title" className="block text-sm font-semibold mb-1" style={{ color: 'var(--color-heading)' }}>
            Judul Notifikasi <span className="text-danger">*</span>
          </label>
          <input
            id="broadcast-title"
            type="text"
            className="w-full px-4 py-3 rounded-2xl border bg-[color:var(--color-surface)] text-[color:var(--color-text)] transition-colors focus:outline-none focus:border-djp-blue focus:ring-1 focus:ring-djp-blue"
            style={{ borderColor: 'var(--color-border)' }}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Contoh: Pengumuman Penting"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="broadcast-body" className="block text-sm font-semibold mb-1" style={{ color: 'var(--color-heading)' }}>
            Isi Pesan <span className="text-danger">*</span>
          </label>
          <textarea
            id="broadcast-body"
            className="w-full px-4 py-3 rounded-2xl border bg-[color:var(--color-surface)] text-[color:var(--color-text)] transition-colors focus:outline-none focus:border-djp-blue focus:ring-1 focus:ring-djp-blue min-h-[100px] resize-y"
            style={{ borderColor: 'var(--color-border)' }}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Contoh: Server akan maintenance pada pukul 00:00 WIB"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="broadcast-url" className="block text-sm font-semibold mb-1" style={{ color: 'var(--color-heading)' }}>
            URL Tujuan (Opsional)
          </label>
          <input
            id="broadcast-url"
            type="text"
            className="w-full px-4 py-3 rounded-2xl border bg-[color:var(--color-surface)] text-[color:var(--color-text)] transition-colors focus:outline-none focus:border-djp-blue focus:ring-1 focus:ring-djp-blue"
            style={{ borderColor: 'var(--color-border)' }}
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="Contoh: /user/dashboard"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-[color:var(--color-text-soft)]">Halaman yang akan dibuka saat notifikasi di-klik.</p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Batal</Button>
          <Button type="submit" loading={loading} className="gap-2">
            <Send size={18} />
            {loading ? 'Mengirim...' : 'Kirim Broadcast'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
