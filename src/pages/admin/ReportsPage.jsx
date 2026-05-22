import { useState, useMemo } from 'react';
import { useBooking } from '../../contexts/BookingContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import { Download, BarChart3, Car } from 'lucide-react';
import { formatDateShort, formatTime } from '../../utils/helpers';
import { BOOKING_STATUS } from '../../utils/constants';
// xlsx is loaded dynamically on export to avoid ~400KB in the initial bundle
import { toast } from 'sonner';

export default function ReportsPage() {
  const { bookings, vehicles } = useBooking();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (b.status === BOOKING_STATUS.CANCELLED) return false;
      if (startDate && new Date(b.startTime) < new Date(startDate)) return false;
      if (endDate && new Date(b.startTime) > new Date(endDate + 'T23:59:59')) return false;
      if (vehicleFilter && b.vehicleId !== vehicleFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }, [bookings, startDate, endDate, vehicleFilter]);

  const pendingFiltered = filtered.filter((b) => b.status === BOOKING_STATUS.PENDING);
  const completedFiltered = filtered.filter((b) => b.status === BOOKING_STATUS.COMPLETED);

  const exportData = async (format) => {
    const { utils, writeFile } = await import('xlsx');

    const data = filtered.map((b) => ({
      'Nama Pegawai': b.userName,
      'Tanggal': formatDateShort(b.startTime),
      'Waktu Mulai': formatTime(b.startTime),
      'Waktu Selesai': formatTime(b.endTime),
      'Keperluan': b.keperluan,
      'Kendaraan': b.vehicleName || '-',
      'Pengemudi': b.driverName || '-',
      'Penumpang': b.jumlahPenumpang,
      'Status': b.status,
      'Catatan': b.catatan || '-',
    }));

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Laporan BOOKOLAKA');

    // Auto-fit columns
    const colWidths = Object.keys(data[0] || {}).map((k) => ({ wch: Math.max(k.length, 15) }));
    ws['!cols'] = colWidths;

    const ext = format === 'xlsx' ? 'xlsx' : 'csv';
    const filename = `Laporan_BOOKOLAKA_${new Date().toISOString().slice(0, 10)}.${ext}`;

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
    { key: 'kendaraan', label: 'Kendaraan' },
    { key: 'status', label: 'Status' },
    { key: 'catatan', label: 'Catatan' },
  ];

  return (
    <div className="min-w-0">
      <PageHeader
        title="Analitik dan ekspor peminjaman"
      />

      <div className="dashboard-grid mb-6">
        <StatCard icon={BarChart3} label="Total Peminjaman" value={filtered.length} color="djp-blue" />
        <StatCard icon={Car} label="Menunggu Persetujuan" value={pendingFiltered.length} color="warning" />
        <StatCard icon={Download} label="Selesai" value={completedFiltered.length} color="info" />
      </div>

      <Card className="p-5 mb-6">
        <h3 className="mb-3 font-heading font-semibold text-[color:var(--color-heading)]">Filter laporan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormInput label="Tanggal Mulai" id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <FormInput label="Tanggal Akhir" id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <FormInput label="Kendaraan" id="vehicle-filter" type="select" value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)}>
            <option value="">Semua Kendaraan</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.platNomor} - {v.merek}</option>)}
          </FormInput>
        </div>
      </Card>

      <DataTable
        title={`Preview Data (${filtered.length} baris)`}
        actions={(
          <>
            <Button variant="success" size="sm" onClick={() => exportData('xlsx')} disabled={filtered.length === 0}><Download size={14} />Excel (.xlsx)</Button>
            <Button variant="secondary" size="sm" onClick={() => exportData('csv')} disabled={filtered.length === 0}><Download size={14} />CSV</Button>
          </>
        )}
        columns={columns}
        empty={filtered.length === 0 ? <div className="empty-state">Tidak ada data sesuai filter.</div> : null}
      >
        {filtered.slice(0, 10).map((b) => (
          <tr key={b.id}>
            <td>{b.userName}</td>
            <td>{formatDateShort(b.startTime)}</td>
            <td className="text-xs">{formatTime(b.startTime)} - {formatTime(b.endTime)}</td>
            <td className="max-w-[220px]"><p className="line-clamp-2">{b.keperluan}</p></td>
            <td className="text-xs">{b.vehicleName || '-'}</td>
            <td><Badge status={b.status} /></td>
            <td className="text-xs max-w-[200px]"><p className="line-clamp-2" title={b.catatan}>{b.catatan || '-'}</p></td>
          </tr>
        ))}
      </DataTable>
      {filtered.length > 10 && <p className="py-3 text-center text-xs text-[color:var(--color-text-soft)]">Menampilkan 10 dari {filtered.length} data. Unduh file untuk melihat semua.</p>}
    </div>
  );
}
