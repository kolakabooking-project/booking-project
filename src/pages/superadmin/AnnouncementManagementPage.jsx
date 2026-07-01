import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import FormInput from '../../components/ui/FormInput';
import RichTextEditor from '../../components/ui/RichTextEditor';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { announcementApi } from '../../lib/api';
import { toast } from 'sonner';
import {
  Bell, Plus, Eye, Edit2, Trash2, Power, Calendar,
  Users, ShieldAlert, Clock, AlertTriangle, Info
} from 'lucide-react';

export default function AnnouncementManagementPage() {
  const addToast = useCallback((msg, type = 'info') => {
    if (toast[type]) toast[type](msg);
    else toast(msg);
  }, []);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'info',
    targetRole: 'all',
    displayFrequency: 'always',
    startDate: '',
    endDate: '',
  });

  // Modal & Dialog state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await announcementApi.superadmin.getAll();
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      addToast('Gagal memuat daftar notifikasi.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAnnouncements();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAnnouncements]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: '',
      content: '',
      priority: 'info',
      targetRole: 'all',
      displayFrequency: 'always',
      startDate: '',
      endDate: '',
    });
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || '',
      content: item.content || '',
      priority: item.priority || 'info',
      targetRole: item.targetRole || 'all',
      displayFrequency: item.displayFrequency || 'always',
      startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 16) : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 16) : '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      addToast('Judul dan isi pengumuman wajib diisi!', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        priority: form.priority,
        targetRole: form.targetRole,
        displayFrequency: form.displayFrequency,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      };

      if (editingId) {
        await announcementApi.superadmin.update(editingId, payload);
        addToast('Notifikasi berhasil diperbarui.', 'success');
      } else {
        await announcementApi.superadmin.create(payload);
        addToast('Notifikasi login baru berhasil dibuat!', 'success');
      }
      resetForm();
      fetchAnnouncements();
    } catch (err) {
      addToast(err?.error || 'Gagal menyimpan notifikasi.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await announcementApi.superadmin.update(item.id, { isActive: !item.isActive });
      addToast(`Notifikasi "${item.title}" ${!item.isActive ? 'diaktifkan' : 'dinonaktifkan'}.`, 'info');
      fetchAnnouncements();
    } catch (err) {
      console.error('Toggle active error:', err);
      addToast('Gagal mengubah status notifikasi.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await announcementApi.superadmin.delete(deleteId);
      addToast('Notifikasi berhasil dihapus.', 'success');
      setDeleteId(null);
      fetchAnnouncements();
    } catch (err) {
      console.error('Delete error:', err);
      addToast('Gagal menghapus notifikasi.', 'error');
    }
  };

  const openLivePreview = (data) => {
    setPreviewData(data || form);
    setPreviewModalOpen(true);
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgent':
        return { bg: 'bg-red-500/10 text-red-600 border-red-500/30', icon: ShieldAlert, label: 'Urgent / Penting' };
      case 'warning':
        return { bg: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: AlertTriangle, label: 'Warning / Perhatian' };
      default:
        return { bg: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: Info, label: 'Info Normal' };
    }
  };

  return (
    <div className="pb-12 max-w-6xl mx-auto space-y-8">
      <PageHeader
        title="Kelola Notifikasi Login"
        subtitle="Buat dan atur pengumuman popup berbentuk card yang otomatis muncul saat user mengakses halaman Pilih Layanan."
      />

      {/* Form Section */}
      <div className="rounded-3xl border p-6 md:p-8 shadow-lg" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
        <div className="flex items-center justify-between pb-6 mb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-djp-blue/10 text-djp-blue">
              <Bell size={24} />
            </div>
            <div>
              <h2 className="text-xl font-heading font-extrabold text-[color:var(--color-heading)]">
                {editingId ? 'Edit Notifikasi Login' : 'Buat Notifikasi Login Baru'}
              </h2>
              <p className="text-xs text-[color:var(--color-text-soft)]">
                Atur formatting teks dengan tombol notes editor di bawah ini.
              </p>
            </div>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-500/10 text-gray-600 hover:bg-gray-500/20"
            >
              Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="Judul Notifikasi"
            placeholder="Contoh: Pemeliharaan Sistem Rutin Akhir Pekan"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <RichTextEditor
            label="Isi Penjelasan Notifikasi"
            placeholder="Tulis penjelasan lengkap di sini... (Bisa huruf tebal, miring, garis bawah, penomoran, bullet list, & perataan)"
            value={form.content}
            onChange={(val) => setForm({ ...form, content: val })}
            required
          />

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-[color:var(--color-surface)] border" style={{ borderColor: 'var(--color-border)' }}>
            <FormInput
              type="select"
              label="Tingkat Urgensi (Priority)"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="info">Info (Biru - Standar)</option>
              <option value="warning">Warning (Kuning - Perhatian)</option>
              <option value="urgent">Urgent (Merah - Sangat Penting)</option>
            </FormInput>

            <FormInput
              type="select"
              label="Target Audiens"
              value={form.targetRole}
              onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
            >
              <option value="all">Semua User (User & Admin)</option>
              <option value="user">Khusus User Biasa</option>
              <option value="admin">Khusus Admin & Superadmin</option>
            </FormInput>

            <FormInput
              type="select"
              label="Frekuensi Muncul"
              value={form.displayFrequency}
              onChange={(e) => setForm({ ...form, displayFrequency: e.target.value })}
            >
              <option value="always">Selalu Tampilkan (Setiap Login)</option>
              <option value="once">Sekali per User (Acknowledge OK)</option>
              <option value="daily">Sekali Sehari</option>
            </FormInput>
          </div>

          {/* Schedule Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-[color:var(--color-surface)] border" style={{ borderColor: 'var(--color-border)' }}>
            <FormInput
              type="datetime-local"
              label="Tanggal Mulai Aktif (Opsional)"
              hint="Kosongkan jika ingin langsung aktif setelah dibuat."
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <FormInput
              type="datetime-local"
              label="Tanggal Berakhir (Opsional)"
              hint="Kosongkan jika ingin terus aktif tanpa batas waktu."
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button
              type="button"
              onClick={() => openLivePreview(form)}
              className="px-5 py-2.5 rounded-xl border border-djp-blue/40 text-djp-blue font-heading font-bold text-sm flex items-center gap-2 hover:bg-djp-blue/10 transition-all"
            >
              <Eye size={18} />
              Live Preview
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-djp-blue text-white font-heading font-bold text-sm flex items-center gap-2 hover:bg-djp-blue-dark shadow-md shadow-djp-blue/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus size={18} />
              )}
              {editingId ? 'Simpan Perubahan' : 'Create Notifikasi'}
            </button>
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-heading font-bold text-[color:var(--color-heading)] flex items-center gap-2">
            <Bell className="text-djp-blue" size={20} />
            Daftar Notifikasi yang Dibuat ({announcements.length})
          </h3>
          <button
            onClick={fetchAnnouncements}
            className="text-xs text-djp-blue font-semibold hover:underline"
          >
            Refresh Daftar
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-djp-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="rounded-3xl border p-12 text-center text-[color:var(--color-text-soft)]" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-heading font-semibold text-base">Belum ada notifikasi yang dibuat</p>
            <p className="text-xs mt-1">Gunakan form di atas untuk membuat notifikasi login pertama.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {announcements.map((item) => {
              const priorityInfo = getPriorityStyle(item.priority);
              const PriorityIcon = priorityInfo.icon;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-5 transition-all shadow-sm ${
                    item.isActive ? 'bg-[color:var(--color-surface-elevated)] border-l-4' : 'bg-black/5 opacity-60 border-l-4 border-l-gray-400'
                  }`}
                  style={{
                    borderColor: 'var(--color-border)',
                    borderLeftColor: item.isActive
                      ? item.priority === 'urgent'
                        ? '#EF4444'
                        : item.priority === 'warning'
                        ? '#F59E0B'
                        : '#3B82F6'
                      : undefined,
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${priorityInfo.bg}`}>
                          <PriorityIcon size={12} />
                          {priorityInfo.label}
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20">
                          <Users size={12} />
                          {item.targetRole === 'all' ? 'Semua User' : item.targetRole === 'admin' ? 'Khusus Admin' : 'Khusus User'}
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <Clock size={12} />
                          {item.displayFrequency === 'always' ? 'Selalu Tampil' : item.displayFrequency === 'once' ? 'Sekali per User' : 'Sekali Sehari'}
                        </span>

                        {!item.isActive && (
                          <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-700 dark:text-gray-300">
                            NONAKTIF
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-heading font-extrabold text-[color:var(--color-heading)]">
                        {item.title}
                      </h4>

                      <div
                        className="text-xs text-[color:var(--color-text)] line-clamp-2 rich-text-content max-w-none"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-[color:var(--color-text-soft)] pt-1">
                        <span>Dibuat oleh: <strong>{item.creatorName || 'Super Admin'}</strong></span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {(item.startDate || item.endDate) && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                              <Calendar size={12} />
                              {item.startDate ? new Date(item.startDate).toLocaleDateString('id-ID') : 'Mulai Sekarang'}
                              {' - '}
                              {item.endDate ? new Date(item.endDate).toLocaleDateString('id-ID') : 'Selamanya'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto justify-end" style={{ borderColor: 'var(--color-border)' }}>
                      <button
                        onClick={() => openLivePreview(item)}
                        title="Lihat Tampilan Popup"
                        className="p-2 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => handleToggleActive(item)}
                        title={item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                          item.isActive
                            ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20'
                        }`}
                      >
                        <Power size={14} />
                        {item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>

                      <button
                        onClick={() => handleEdit(item)}
                        title="Edit Notifikasi"
                        className="p-2 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        onClick={() => setDeleteId(item.id)}
                        title="Hapus Notifikasi"
                        className="p-2 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Simulasi Tampilan Popup Card di Select Service"
        maxWidth="max-w-lg"
      >
        {previewData && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Eye size={16} className="flex-shrink-0" />
              <span>Ini adalah simulasi tampilan card yang akan dilihat user di halaman Pilih Layanan.</span>
            </div>

            {/* Simulated Card */}
            <div className="rounded-3xl border-2 shadow-2xl overflow-hidden bg-[color:var(--color-surface)] border-djp-blue/40">
              <div className="bg-gradient-to-r from-djp-blue to-djp-blue-dark p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2 font-heading font-extrabold text-base">
                  <Bell className="animate-bounce" size={20} />
                  <span>Pengumuman Sistem</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">
                  {previewData.priority?.toUpperCase() || 'INFO'}
                </span>
              </div>

              <div className="p-6 space-y-4">
                <h3 className="text-lg font-heading font-extrabold text-[color:var(--color-heading)]">
                  {previewData.title || 'Judul Notifikasi'}
                </h3>

                <div
                  className="text-sm text-[color:var(--color-text)] leading-relaxed rich-text-content max-w-none max-h-[40vh] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: previewData.content || 'Isi penjelasan notifikasi...' }}
                />

                <div className="pt-4 border-t flex items-center justify-between gap-4" style={{ borderColor: 'var(--color-border)' }}>
                  <label className="flex items-center gap-2 text-xs text-[color:var(--color-text-soft)] cursor-pointer select-none">
                    <input type="checkbox" className="rounded text-djp-blue focus:ring-djp-blue" defaultChecked />
                    <span>Jangan tampilkan lagi pesan ini</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setPreviewModalOpen(false)}
                    className="px-6 py-2 rounded-xl bg-djp-blue text-white font-heading font-bold text-sm shadow-md hover:bg-djp-blue-dark active:scale-95 transition-all"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Notifikasi Login"
        message="Apakah Anda yakin ingin menghapus pengumuman ini? Notifikasi yang dihapus tidak dapat dikembalikan."
        confirmText="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
}
