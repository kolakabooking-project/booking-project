import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, MapPin, CheckCircle } from 'lucide-react';
import JourneyTracker from './JourneyTracker';
import './MyJourneyTracker.css';
import { useSPDSummary } from '../../hooks/useSheetData';

export default function MyTrackingJourneyTracker() {
  const navigate = useNavigate();
  const { data: summary } = useSPDSummary();

  const handleNavigate = () => {
    navigate('/user/tracking/spd-saya');
  };

  const config = {
    title: "Ringkasan Perjalanan",
    toggleButtonClass: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/30",
    checkpoints: [
      {
        id: 'total',
        type: 'dynamic',
        icon: FileText,
        count: summary?.totalSpd || 0,
        checkpointClass: 'mjt-checkpoint--pending',
        onClick: handleNavigate,
        renderCardContent: () => (
          <>
            <div className="mjt-checkpoint-label">Total SPD</div>
            <div className="mjt-counter">{summary?.totalSpd || 0}</div>
            <div className="mjt-counter-label">Surat perjalanan terdaftar</div>
          </>
        )
      },
      {
        id: 'hari',
        type: 'dynamic',
        icon: Calendar,
        count: summary?.totalHariPerjalanan || 0,
        checkpointClass: 'mjt-checkpoint--approved',
        onClick: handleNavigate,
        renderCardContent: () => (
          <>
            <div className="mjt-checkpoint-label">Hari Perjalanan</div>
            <div className="mjt-counter">{summary?.totalHariPerjalanan || 0}</div>
            <div className="mjt-counter-label">Dihabiskan untuk tugas luar</div>
          </>
        )
      },
      {
        id: 'wilayah',
        type: 'dynamic',
        icon: MapPin,
        count: summary?.jumlahWilayah || 0,
        checkpointClass: 'mjt-checkpoint--ongoing',
        onClick: handleNavigate,
        renderCardContent: () => (
          <>
            <div className="mjt-checkpoint-label">Wilayah</div>
            <div className="mjt-counter">{summary?.jumlahWilayah || 0}</div>
            <div className="mjt-counter-label">Kota tujuan perjalanan</div>
          </>
        )
      },
      {
        id: 'sikka',
        type: 'dynamic',
        icon: CheckCircle,
        count: summary?.inputSikkaSelesai || 0,
        checkpointClass: 'mjt-checkpoint--done',
        nodeClass: 'border-emerald-200',
        iconClass: 'text-emerald-600',
        countClass: 'text-emerald-700',
        cardClass: 'border-emerald-100 shadow-sm hover:border-emerald-300',
        onClick: handleNavigate,
        renderCardContent: () => (
          <>
            <div className="mjt-sparkles">
              <span className="mjt-sparkle-dot bg-emerald-400" />
              <span className="mjt-sparkle-dot bg-emerald-400" />
              <span className="mjt-sparkle-dot bg-emerald-400" />
              <span className="mjt-sparkle-dot bg-emerald-400" />
            </div>
            <div className="mjt-checkpoint-label text-emerald-800">SIKKA Selesai</div>
            <div className="mjt-flag"><span style={{ fontSize: '1.5rem' }}>🏁</span></div>
            <div className="mjt-counter text-emerald-600" style={{ marginTop: '0.25rem' }}>{summary?.inputSikkaSelesai || 0}</div>
            <div className="mjt-counter-label">Status input telah selesai</div>
          </>
        )
      }
    ]
  };

  return <JourneyTracker config={config} />;
}
