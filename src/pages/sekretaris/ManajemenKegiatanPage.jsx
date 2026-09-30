import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { jadwalKepalaApi } from '../../lib/api';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Clock, 
  MapPin, 
  CalendarDays, 
  X, 
  Loader2, 
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const MONTH_OPTIONS = [
  { value: '', label: 'Semua Bulan' },
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

export default function ManajemenKegiatanPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [kegiatanList, setKegiatanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));

  // Form modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    tanggal: '',
    waktuMulai: '09:00',
    waktuSelesai: '',
    agenda: '',
    tempat: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await jadwalKepalaApi.getKegiatan({
        search: search || undefined,
        month: month ? parseInt(month, 10) : undefined,
        year: year ? parseInt(year, 10) : undefined,
      });
      setKegiatanList(res?.data || []);
    } catch (err) {
      toast.error('Gagal memuat daftar kegiatan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, month, year]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      tanggal: new Date().toISOString().split('T')[0],
      waktuMulai: '09:00',
      waktuSelesai: '',
      agenda: '',
      tempat: '',
    });
    setModalOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      handleOpenCreate();
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams]);

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      tanggal: item.tanggal,
      waktuMulai: item.waktuMulai,
      waktuSelesai: item.waktuSelesai || '',
      agenda: item.agenda,
      tempat: item.tempat,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingItem) {
        await jadwalKepalaApi.updateKegiatan(editingItem.id, form);
        toast.success('Agenda kegiatan berhasil diperbarui');
      } else {
        await jadwalKepalaApi.createKegiatan(form);
        toast.success('Agenda kegiatan berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan agenda kegiatan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await jadwalKepalaApi.deleteKegiatan(deleteTarget.id);
      toast.success('Agenda kegiatan berhasil dihapus');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus agenda');
    }
  };

  return (
    <div className="pb-10 space-y-6">
      <PageHeader
        title="Manajemen Agenda Kegiatan"
        subtitle="Kelola seluruh agenda, rapat, dan kegiatan resmi Kepala Kantor KPP Pratama Kolaka."
      />

      {/* Action Bar & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)]" />
            <input
              type="text"
              placeholder="Cari agenda atau tempat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control pl-11 pr-4 py-2.5 text-xs sm:text-sm"
            />
          </div>

          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="form-control py-2.5 text-xs sm:text-sm w-auto min-w-[130px]"
          >
            {MONTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="form-control py-2.5 text-xs sm:text-sm w-24"
            placeholder="Tahun"
          />
        </div>

        <Button onClick={handleOpenCreate} className="flex items-center gap-2 flex-shrink-0">
          <Plus size={16} />
          <span>Tambah Kegiatan</span>
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
                <th className="px-4 py-3 font-heading font-bold text-[color:var(--color-text-soft)] text-xs uppercase tracking-wider">Tanggal</th>
                <th className="px-4 py-3 font-heading font-bold text-[color:var(--color-text-soft)] text-xs uppercase tracking-wider">Waktu</th>
                <th className="px-4 py-3 font-heading font-bold text-[color:var(--color-text-soft)] text-xs uppercase tracking-wider">Agenda Kegiatan</th>
                <th className="px-4 py-3 font-heading font-bold text-[color:var(--color-text-soft)] text-xs uppercase tracking-wider">Tempat</th>
                <th className="px-4 py-3 font-heading font-bold text-[color:var(--color-text-soft)] text-xs uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600" />
                  </td>
                </tr>
              ) : kegiatanList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[color:var(--color-text-soft)]">
                    {search || month ? 'Tidak ada kegiatan yang cocok dengan filter' : 'Belum ada agenda kegiatan yang tercatat'}
                  </td>
                </tr>
              ) : (
                kegiatanList.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-[color:var(--color-surface-muted)] transition-colors" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3.5 font-semibold text-[color:var(--color-heading)] whitespace-nowrap">
                      {item.tanggal}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                        <Clock size={12} />
                        {item.waktuMulai} {item.waktuSelesai ? `- ${item.waktuSelesai}` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-[color:var(--color-heading)] line-clamp-2 max-w-md">
                        {item.agenda}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[color:var(--color-text-muted)]">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-teal-500 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{item.tempat}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 rounded-xl text-[color:var(--color-text-muted)] hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/60 transition-colors"
                          title="Edit Agenda"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-2 rounded-xl text-[color:var(--color-text-muted)] hover:text-danger hover:bg-danger/10 transition-colors"
                          title="Hapus Agenda"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col animate-scale-in"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
          >
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              <h3 className="text-base font-heading font-bold text-[color:var(--color-heading)]">
                {editingItem ? 'Edit Agenda Kegiatan' : 'Tambah Agenda Kegiatan Kepala Kantor'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-full hover:bg-[color:var(--color-surface)]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-heading font-semibold text-[color:var(--color-text-muted)] mb-1">
                  Hari / Tanggal <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-heading font-semibold text-[color:var(--color-text-muted)] mb-1">
                    Waktu Mulai <span className="text-danger">*</span>
                  </label>
                  <input
                    type="time"
                    value={form.waktuMulai}
                    onChange={(e) => setForm({ ...form, waktuMulai: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-semibold text-[color:var(--color-text-muted)] mb-1">
                    Waktu Selesai (Opsional)
                  </label>
                  <input
                    type="time"
                    value={form.waktuSelesai}
                    onChange={(e) => setForm({ ...form, waktuSelesai: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-[color:var(--color-text-muted)] mb-1">
                  Agenda Kegiatan <span className="text-danger">*</span>
                </label>
                <textarea
                  value={form.agenda}
                  onChange={(e) => setForm({ ...form, agenda: e.target.value })}
                  rows={3}
                  className="form-control"
                  placeholder="Deskripsi agenda..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-semibold text-[color:var(--color-text-muted)] mb-1">
                  Tempat Pelaksanaan <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.tempat}
                  onChange={(e) => setForm({ ...form, tempat: e.target.value })}
                  className="form-control"
                  placeholder="Lokasi kegiatan..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" loading={submitting}>
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Agenda'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Agenda Kegiatan"
        message={`Apakah Anda yakin ingin menghapus agenda "${deleteTarget?.agenda}" pada ${deleteTarget?.tanggal}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
}
