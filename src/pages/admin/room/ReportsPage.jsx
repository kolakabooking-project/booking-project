import { useState, useMemo } from 'react';
import { useRoomBooking } from '../../../contexts/RoomBookingContext';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import FormInput from '../../../components/ui/FormInput';
import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';
import PageHeader from '../../../components/ui/PageHeader';
import Badge from '../../../components/ui/Badge';
import { Download, BarChart3, Building2 } from 'lucide-react';
import { formatDateShort, formatTime } from '../../../utils/helpers';
// xlsx is loaded dynamically on export to avoid ~400KB in the initial bundle
import { toast } from 'sonner';

export default function ReportsPage() {
  const { roomBookings, rooms } = useRoomBooking();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [roomFilter, setRoomFilter] = useState('');

  const filtered = useMemo(() => {
    return roomBookings.filter((b) => {
      if (b.status === 'Dibatalkan') return false;
      if (startDate && new Date(b.startTime) < new Date(startDate)) return false;
      if (endDate && new Date(b.startTime) > new Date(endDate + 'T23:59:59')) return false;
      if (roomFilter && b.roomId !== roomFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }, [roomBookings, startDate, endDate, roomFilter]);

  const activeFiltered = filtered.filter((b) => b.status === 'Disetujui' || b.status === 'Berlangsung');
  const completedFiltered = filtered.filter((b) => b.status === 'Selesai' || b.status === 'Selesai dengan Catatan');

  const exportData = async (format) => {
    const { utils, writeFile } = await import('xlsx');

    const data = filtered.map((b) => ({
      'Nama Pegawai': b.userName,
      'Tanggal': formatDateShort(b.startTime),
      'Waktu Mulai': formatTime(b.startTime),
      'Waktu Selesai': formatTime(b.endTime),
      'Keperluan': b.keperluan,
      'Ruangan': b.roomName || '-',
      'Jumlah Peserta': b.jumlahPeserta,
      'Status': b.status,
      'Catatan': b.catatan || '-',
    }));

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Laporan Ruangan BOOKOLAKA');

    // Auto-fit columns
    const colWidths = Object.keys(data[0] || {}).map((k) => ({ wch: Math.max(k.length, 15) }));
    ws['!cols'] = colWidths;

    const ext = format === 'xlsx' ? 'xlsx' : 'csv';
    const filename = `Laporan_Ruangan_BOOKOLAKA_${new Date().toISOString().slice(0, 10)}.${ext}`;

    if (format === 'csv') {
      writeFile(wb, filename, { bookType: 'csv' });
    } else {
      writeFile(wb, filename);
    }
    toast.success(`📥 File ${filename} berhasil diunduh`);
  };

  const columns = [
    { key: 'pegawai', label: 'Pegawai' },
    { key: 'tanggal', label: 'Tanggal' },
    { key: 'waktu', label: 'Waktu' },
    { key: 'keperluan', label: 'Keperluan' },
    { key: 'ruangan', label: 'Ruangan' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div className="min-w-0">
      <PageHeader
        title="Laporan & Ekspor Ruangan"
        subtitle="Analitik penggunaan ruangan dan unduh laporan peminjaman."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={BarChart3} label="Total Peminjaman" value={filtered.length} color="djp-blue" />
        <StatCard icon={Building2} label="Aktif/Akan Datang" value={activeFiltered.length} color="warning" />
        <StatCard icon={Download} label="Selesai" value={completedFiltered.length} color="info" />
      </div>

      <Card className="p-6 mb-8 border border-blue-100 shadow-sm">
        <h3 className="mb-4 font-heading font-semibold text-lg text-gray-800 dark:text-gray-200">Filter Laporan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <FormInput label="Tanggal Mulai" id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <FormInput label="Tanggal Akhir" id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <FormInput label="Ruangan" id="room-filter" type="select" value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)}>
            <option value="">Semua Ruangan</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </FormInput>
        </div>
      </Card>

      <DataTable
        title={`Preview Data (${filtered.length} baris)`}
        actions={(
          <div className="flex gap-2">
            <Button variant="success" size="sm" onClick={() => exportData('xlsx')} disabled={filtered.length === 0} className="shadow-sm shadow-green-500/20"><Download size={14} />Excel (.xlsx)</Button>
            <Button variant="secondary" size="sm" onClick={() => exportData('csv')} disabled={filtered.length === 0}><Download size={14} />CSV</Button>
          </div>
        )}
        columns={columns}
        empty={filtered.length === 0 ? <div className="empty-state">Tidak ada data sesuai filter.</div> : null}
      >
        {filtered.slice(0, 10).map((b) => (
          <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <td className="font-medium text-gray-900 dark:text-gray-100">{b.userName}</td>
            <td className="text-gray-600 dark:text-gray-400">{formatDateShort(b.startTime)}</td>
            <td className="text-xs text-gray-500 font-mono">{formatTime(b.startTime)} - {formatTime(b.endTime)}</td>
            <td className="max-w-[220px]"><p className="line-clamp-2 text-gray-700 dark:text-gray-300">{b.keperluan}</p></td>
            <td className="text-sm font-semibold text-blue-600">{b.roomName || '-'}</td>
            <td><Badge status={b.status} /></td>
          </tr>
        ))}
      </DataTable>
      {filtered.length > 10 && <p className="py-4 text-center text-xs text-gray-500 bg-gray-50 rounded-b-xl border-x border-b border-gray-100">Menampilkan 10 dari {filtered.length} data. Unduh file untuk melihat semua.</p>}
    </div>
  );
}
