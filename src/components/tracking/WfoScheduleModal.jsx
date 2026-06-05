import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Search, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function WfoScheduleModal({ isOpen, onClose, onRefresh }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [dateOptions, setDateOptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Generate 4 upcoming Fridays
  useEffect(() => {
    if (isOpen) {
      const fridays = [];
      const today = new Date();
      // Find the next Friday (or today if it's Friday)
      const dayOfWeek = today.getDay();
      const distanceToFriday = (5 + 7 - dayOfWeek) % 7;
      let nextFriday = new Date(today);
      nextFriday.setDate(today.getDate() + distanceToFriday);

      for (let i = 0; i < 4; i++) {
        const d = new Date(nextFriday);
        d.setDate(nextFriday.getDate() + i * 7);
        const dateString = d.toISOString().split('T')[0];
        fridays.push({
          value: dateString,
          label: i === 0 ? `Jumat Minggu Ini (${dateString})` : `Jumat, ${dateString}`
        });
      }
      setDateOptions(fridays);
      setSelectedDate(fridays[0].value);
    }
  }, [isOpen]);

  // Fetch schedule and all users when date changes
  useEffect(() => {
    if (isOpen && selectedDate) {
      fetchData(selectedDate);
    }
  }, [isOpen, selectedDate]);

  const fetchData = async (date) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/wfo/${date}`);
      if (!res.ok) throw new Error('Gagal mengambil data jadwal');
      const data = await res.json();
      
      setUsers(data.data);
      
      // Pre-select WFO
      const wfoIds = new Set(
        data.data.filter(u => u.tipe === 'WFO').map(u => u.id)
      );
      setSelectedUserIds(wfoIds);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat jadwal WFO');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUser = (userId) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUserIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const exportToExcel = (updatedUsers) => {
    const exportData = updatedUsers.map((u, index) => ({
      'No': index + 1,
      'Nama Pegawai': u.namaPegawai,
      'NIP': u.nip || '-',
      'Jabatan / Golongan': u.jabatan || '-',
      'Status': u.tipe,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jadwal Jumat');

    // Auto-size columns
    const colWidths = [
      { wch: 5 }, // No
      { wch: 30 }, // Nama
      { wch: 20 }, // NIP
      { wch: 30 }, // Jabatan
      { wch: 10 }, // Status
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `Jadwal_Jumat_${selectedDate}.xlsx`);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const userIdsArray = Array.from(selectedUserIds);
      const res = await fetch('/api/wfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, userIds: userIdsArray })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal menyimpan jadwal');
      }

      toast.success('Jadwal WFO berhasil disimpan!');
      
      // Auto export
      const updatedUsers = users.map(u => ({
        ...u,
        tipe: selectedUserIds.has(u.id) ? 'WFO' : 'WFH'
      }));
      exportToExcel(updatedUsers);

      if (onRefresh) onRefresh(selectedDate);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan jadwal');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.namaPegawai.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.nip && u.nip.includes(searchTerm))
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-[color:var(--color-bg-shell)] shadow-2xl border"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
            <div>
              <h2 className="font-heading text-lg font-bold text-[color:var(--color-heading)]">
                Buat / Edit Jadwal WFO
              </h2>
              <p className="text-xs text-[color:var(--color-text-soft)] mt-0.5">Pilih pegawai yang akan WFO. Yang tidak terpilih akan berstatus WFH.</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-[color:var(--color-text-soft)] hover:bg-[color:var(--color-surface-muted)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[color:var(--color-text-main)]">Tanggal (Jumat)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)]" size={18} />
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm appearance-none bg-[color:var(--color-surface-elevated)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
                >
                  {dateOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[color:var(--color-text-main)]">Pilih Pegawai (WFO)</label>
                <button 
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  {selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Search Pegawai */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)]" size={16} />
                <input
                  type="text"
                  placeholder="Cari nama pegawai..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border pl-9 pr-4 py-2 text-sm bg-[color:var(--color-surface-elevated)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
                />
              </div>

              {/* List Pegawai */}
              <div className="max-h-64 overflow-y-auto rounded-xl border bg-[color:var(--color-surface-elevated)]" style={{ borderColor: 'var(--color-border)' }}>
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="animate-spin text-emerald-500" size={24} />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[color:var(--color-text-soft)]">
                    Tidak ada pegawai ditemukan.
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                    {filteredUsers.map(user => (
                      <label 
                        key={user.id}
                        className="flex items-center gap-3 p-3 hover:bg-[color:var(--color-surface-muted)] cursor-pointer transition-colors"
                      >
                        <input 
                          type="checkbox"
                          checked={selectedUserIds.has(user.id)}
                          onChange={() => handleToggleUser(user.id)}
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="text-sm font-semibold text-[color:var(--color-heading)]">{user.namaPegawai}</div>
                          <div className="text-xs text-[color:var(--color-text-soft)] mt-0.5">{user.nip || '-'}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t px-6 py-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-semibold text-[color:var(--color-text-soft)] hover:text-[color:var(--color-text-main)] transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving || isLoading}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSaving ? (
                <><Loader2 className="animate-spin" size={16} /> Menyimpan...</>
              ) : (
                <><FileSpreadsheet size={16} /> Simpan & Export Excel</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
