import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../contexts/BookingContext';
import { useLoading } from '../../contexts/LoadingContext';
import { VEHICLE_STATUS, BOOKING_STATUS } from '../../utils/constants';
import { Warehouse, ShieldAlert, Navigation, Wrench, CarFront, Bike, PackageCheck, CircleDashed, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import Badge from '../ui/Badge';
import { formatDateShort, formatTime } from '../../utils/helpers';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { CarIcon as CarSVG, MotorcycleIcon as MotorcycleSVG } from '../icons/VehicleIcons';
import './FleetCommandCenter.css';

/* ──────────────────────────────────────────────
   Vehicle Slot
   ────────────────────────────────────────────── */

function VehicleSlot({ vehicle, variant = 'available', booking, onClick }) {
  const isCar = vehicle.tipe === 'Mobil';
  const shortPlat = vehicle.platNomor.split(' ').pop();
  const displayId = `KDO-${vehicle.id.replace(/\D/g, '') || vehicle.id.slice(-2)}`;
  const slotClass = `fcc-vehicle-slot fcc-vehicle-slot--${variant}`;

  return (
    <div className={slotClass} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}>
      <div className="fcc-tooltip">
        <div className="fcc-tooltip-title">{vehicle.merek}</div>
        <div className="fcc-tooltip-sub">{vehicle.platNomor} • {vehicle.warna || vehicle.tipe}</div>
        {variant === 'maintenance' && <div className="fcc-tooltip-sub" style={{ color: '#f59e0b' }}>🔧 Dalam Perawatan</div>}
        {booking && (
          <>
            <div className="fcc-tooltip-sub" style={{ marginTop: '3px' }}>👤 {booking.userName}</div>
            <div className="fcc-tooltip-sub">{booking.keperluan?.slice(0, 40)}{booking.keperluan?.length > 40 ? '…' : ''}</div>
          </>
        )}
        {variant === 'pending' && <div className="fcc-tooltip-action">Klik untuk review →</div>}
      </div>
      {variant === 'pending' && <span className="fcc-beacon" />}
      {variant === 'maintenance' && <span className="fcc-badge-wrench"><Wrench /></span>}
      {isCar ? <CarSVG size={variant === 'pending' ? 56 : 50} /> : <MotorcycleSVG size={variant === 'pending' ? 50 : 44} />}
      <span className="fcc-vehicle-label">{displayId}</span>
      {variant === 'pending' && booking && <span className="fcc-pending-info">{booking.userName?.split(' ')[0]}</span>}
      {variant === 'active' && booking && <span className="fcc-user-tag">{booking.userName?.split(' ')[0]}</span>}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────── */

export default function FleetCommandCenter() {
  const navigate = useNavigate();
  const { vehicles, bookings, getPendingBookings, approveBooking, rejectBooking } = useBooking();
  const { showLoading, hideLoading } = useLoading();

  const [modal, setModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const zoneData = useMemo(() => {
    const pendingBookings = getPendingBookings();
    const now = new Date();
    const activeBookings = bookings.filter((b) => {
      if (b.status === BOOKING_STATUS.ONGOING) return true;
      if (b.status === BOOKING_STATUS.APPROVED) {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        return now >= start && now <= end;
      }
      return false;
    });

    const missionVehicleIds = new Set(activeBookings.map(b => b.vehicleId).filter(Boolean));

    const garageVehicles = vehicles.filter((v) => !missionVehicleIds.has(v.id));

    const pendingWithVehicle = [];
    pendingBookings.forEach((b) => {
      if (b.vehicleId) {
        const vehicle = vehicles.find((v) => v.id === b.vehicleId);
        if (vehicle) pendingWithVehicle.push({ vehicle, booking: b });
      }
    });
    const pendingWithoutVehicle = pendingBookings.filter((b) => !b.vehicleId);

    const missionVehicles = activeBookings
      .filter((b) => b.vehicleId)
      .map((b) => {
        const v = vehicles.find((vec) => vec.id === b.vehicleId);
        return { vehicle: v, booking: b };
      })
      .filter((item) => item.vehicle);

    return { garageVehicles, pendingWithVehicle, pendingWithoutVehicle, missionVehicles };
  }, [vehicles, bookings, getPendingBookings]);

  const { garageVehicles, pendingWithVehicle, pendingWithoutVehicle, missionVehicles } = zoneData;

  const handlePendingClick = (booking) => {
    setModal(booking);
    setRejectReason('');
    setShowReject(false);
  };

  const handleApprove = async () => {
    if (!modal) return;
    if (!modal.vehicleId) { toast.error('Kendaraan belum dipilih oleh pengguna'); return; }
    showLoading('Menyetujui peminjaman kendaraan...');
    try {
      await approveBooking(modal.id, modal.vehicleId, null);
      toast.success(`✅ Peminjaman ${modal.userName} disetujui`);
      setModal(null);
    } catch (err) {
      toast.error(err.message || 'Gagal menyetujui peminjaman');
    } finally {
      hideLoading();
    }
  };

  const handleReject = async () => {
    if (!modal) return;
    if (!rejectReason.trim()) { toast.error('Masukkan alasan penolakan'); return; }
    showLoading('Menolak pengajuan peminjaman...');
    try {
      await rejectBooking(modal.id, rejectReason);
      toast.success(`Peminjaman ${modal.userName} ditolak`);
      setModal(null);
    } catch (err) {
      toast.error(err.message || 'Gagal menolak peminjaman');
    } finally {
      hideLoading();
    }
  };

  const availableCount = garageVehicles.filter((v) => v.status !== VEHICLE_STATUS.MAINTENANCE).length;
  const maintenanceCount = garageVehicles.filter((v) => v.status === VEHICLE_STATUS.MAINTENANCE).length;
  const pendingCount = pendingWithVehicle.length + pendingWithoutVehicle.length;
  const missionCount = missionVehicles.length;

  const bodyVariants = {
    expanded: { 
      opacity: 1, 
      height: 'auto',
      transitionEnd: { overflow: 'visible' }
    },
    collapsed: { 
      opacity: 0, 
      height: 0,
      overflow: 'hidden'
    },
  };

  const rollDownTransition = { 
    duration: 0.5, 
    ease: [0.25, 1, 0.5, 1] // map roll down effect
  };

  return (
    <div className={`fcc-root ${!isExpanded ? 'fcc-root--collapsed' : ''}`}>
      {/* Toggle Button */}
      <button
        className="fcc-toggle-btn"
        onClick={() => setIsExpanded((v) => !v)}
        type="button"
        aria-expanded={isExpanded}
      >
        <span className="fcc-toggle-text">Status Garasi KDO</span>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown size={14} />
        </motion.div>
      </button>

      <div className="fcc-container">
        {/* ═══════════ ZONA 1: GARASI UTAMA ═══════════ */}
        <div className={`fcc-zone fcc-zone--garage ${!isExpanded ? 'fcc-zone--collapsed' : ''}`}>
          <div className="fcc-zone-header">
            <Warehouse className="fcc-zone-header-icon" />
            <span>Garasi Kolaka</span>
          </div>
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                variants={bodyVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={rollDownTransition}
                className="fcc-zone-body-wrap"
              >
                <div className="fcc-zone-body">
                  {garageVehicles.length === 0 ? (
                    <div className="fcc-empty">
                      <CircleDashed size={28} />
                      <span>Semua kendaraan bertugas</span>
                    </div>
                  ) : (
                    garageVehicles.map((v) => (
                      <VehicleSlot key={v.id} vehicle={v} variant={v.status === VEHICLE_STATUS.MAINTENANCE ? 'maintenance' : 'available'} />
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="fcc-zone-footer">
            <span>Tersedia:</span>
            <span className="fcc-zone-footer-num">{availableCount}</span>
            {maintenanceCount > 0 && <span style={{ fontSize: '0.625rem', opacity: 0.6, marginLeft: '0.25rem' }}>({maintenanceCount} perawatan)</span>}
          </div>
        </div>

        {/* ═══════════ ZONA 2: GERBANG PERSETUJUAN ═══════════ */}
        <div className={`fcc-zone fcc-zone--gate ${!isExpanded ? 'fcc-zone--collapsed' : ''}`}>
          <div className="fcc-zone-header">
            <ShieldAlert className="fcc-zone-header-icon" />
            <span>Gerbang Keluar</span>
          </div>
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                variants={bodyVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={rollDownTransition}
                className="fcc-zone-body-wrap"
              >
                <div className="fcc-zone-body" style={{ justifyContent: 'center' }}>
                  {pendingCount === 0 ? (
                    <div className="fcc-empty">
                      <PackageCheck size={28} />
                      <span>Tidak ada antrean</span>
                    </div>
                  ) : (
                    <>
                      {pendingWithVehicle.map(({ vehicle, booking }) => (
                        <VehicleSlot key={booking.id} vehicle={vehicle} variant="pending" booking={booking} onClick={() => handlePendingClick(booking)} />
                      ))}
                      {pendingWithoutVehicle.map((booking) => (
                        <div key={booking.id} className="fcc-vehicle-slot fcc-vehicle-slot--pending" onClick={() => handlePendingClick(booking)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePendingClick(booking); }}>
                          <span className="fcc-beacon" />
                          <div className="fcc-tooltip">
                            <div className="fcc-tooltip-title">{booking.userName}</div>
                            <div className="fcc-tooltip-sub">{booking.jenisKendaraan} • Belum dialokasikan</div>
                            <div className="fcc-tooltip-sub">{booking.keperluan?.slice(0, 40)}</div>
                            <div className="fcc-tooltip-action">Klik untuk review →</div>
                          </div>
                          <CarSVG size={50} />
                          <span className="fcc-vehicle-label">Baru</span>
                          <span className="fcc-pending-info">{booking.userName?.split(' ')[0]}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="fcc-zone-footer">
            <span>Persetujuan:</span>
            <span className="fcc-zone-footer-num">{pendingCount}</span>
          </div>
        </div>

        {/* ═══════════ ZONA 3: AREA OPERASIONAL ═══════════ */}
        <div className={`fcc-zone fcc-zone--mission ${!isExpanded ? 'fcc-zone--collapsed' : ''}`}>
          <div className="fcc-zone-header">
            <Navigation className="fcc-zone-header-icon" />
            <span>On-Mission</span>
          </div>
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                variants={bodyVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={rollDownTransition}
                className="fcc-zone-body-wrap"
              >
                <div className="fcc-zone-body" style={{ justifyContent: 'center' }}>
                  {missionCount === 0 ? (
                    <div className="fcc-empty">
                      <CarFront size={28} />
                      <span>Belum ada yang bertugas</span>
                    </div>
                  ) : (
                    missionVehicles.map(({ vehicle, booking }) => (
                      <VehicleSlot key={vehicle.id} vehicle={vehicle} variant="active" booking={booking} />
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="fcc-zone-footer">
            <span>Aktif:</span>
            <span className="fcc-zone-footer-num">{missionCount}</span>
          </div>
        </div>
      </div>

      {/* Detail & Approval Modal */}
      <Modal isOpen={!!modal} onClose={() => setModal(null)} title="Detail Peminjaman" size="lg">
        {modal && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div><span className="font-semibold text-[color:var(--color-text-soft)]">Pegawai:</span><p className="text-[color:var(--color-heading)]">{modal.userName}</p></div>
              <div><span className="font-semibold text-[color:var(--color-text-soft)]">Status:</span><div className="mt-1"><Badge status={modal.status} /></div></div>
              <div><span className="font-semibold text-[color:var(--color-text-soft)]">Waktu:</span><p className="text-[color:var(--color-heading)]">{formatDateShort(modal.startTime)} {formatTime(modal.startTime)}-{formatTime(modal.endTime)}</p></div>
              <div><span className="font-semibold text-[color:var(--color-text-soft)]">Penumpang:</span><p className="text-[color:var(--color-heading)]">{modal.jumlahPenumpang} orang</p></div>
              <div className="col-span-2"><span className="font-semibold text-[color:var(--color-text-soft)]">Keperluan:</span><p className="text-[color:var(--color-heading)]">{modal.keperluan}</p></div>
              {modal.catatan && <div className="col-span-2"><span className="font-semibold text-[color:var(--color-text-soft)]">Catatan Pengajuan:</span><p className="text-[color:var(--color-heading)]">{modal.catatan}</p></div>}
              {modal.perluSopir && <div><span className="font-semibold text-[color:var(--color-text-soft)]">Sopir:</span><p className="font-semibold text-djp-blue">Diperlukan</p></div>}
              {modal.vehicleName && <div><span className="font-semibold text-[color:var(--color-text-soft)]">Kendaraan:</span><p className="font-semibold text-djp-blue">{modal.vehicleName}</p></div>}
            </div>
            {modal.status === BOOKING_STATUS.PENDING && (
              <div className="border-t pt-4 space-y-4" style={{ borderColor: 'var(--color-border)' }}>
                {!showReject ? (
                  <>
                    <div className="rounded-2xl p-4 bg-djp-blue/5 border border-djp-blue/10">
                      <p className="text-sm font-medium text-[color:var(--color-heading)]">Kendaraan yang diajukan:</p>
                      <p className="text-sm font-bold text-djp-blue mt-1">{modal.vehicleName || 'Belum dialokasikan'}</p>
                      {modal.perluSopir && <p className="text-sm text-[color:var(--color-text-muted)] mt-1">Sopir akan ditugaskan secara otomatis.</p>}
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                      <Button variant="danger" onClick={() => setShowReject(true)}><XCircle size={16} />Tolak</Button>
                      <Button variant="success" onClick={handleApprove}><CheckCircle size={16} />Setujui</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-danger-light/30 rounded-2xl p-4">
                      <FormInput label="Alasan Penolakan" id="reject-reason" type="textarea" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Jelaskan alasan penolakan..." required />
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                      <Button variant="ghost" onClick={() => setShowReject(false)}>Kembali</Button>
                      <Button variant="danger" onClick={handleReject}><XCircle size={16} />Konfirmasi Tolak</Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
