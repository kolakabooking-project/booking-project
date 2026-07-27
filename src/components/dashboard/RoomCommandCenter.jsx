import React, { useMemo, useState } from 'react';
import { useRoomBooking } from '../../contexts/RoomBookingContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLoading } from '../../contexts/LoadingContext';
import { ROOM_STATUS } from '../../utils/constants';
import { 
  Building2, 
  ShieldAlert, 
  DoorOpen, 
  Wrench, 
  PackageCheck, 
  CircleDashed, 
  ChevronDown, 
  Users 
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import FormInput from '../ui/FormInput';
import { formatDateShort, formatTime } from '../../utils/helpers';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import './RoomCommandCenter.css';

const RoomCommandCenter = () => {
  const { rooms, roomBookings, cancelRoomBooking } = useRoomBooking();
  const { user } = useAuth();
  const { isLoading } = useLoading();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const { availableRooms, pendingBookings, activeBookings, maintenanceRooms } = useMemo(() => {
    const pending = (roomBookings || []).filter(b => b.status === 'Pending');
    const now = new Date();
    
    const active = (roomBookings || []).filter(b => {
      if (b.status === 'Sedang Digunakan') return true;
      if (b.status === 'Disetujui') {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        return now >= start && now <= end;
      }
      return false;
    });
    
    const activeRoomIds = new Set(active.map(b => b.roomId).filter(Boolean));
    const available = (rooms || []).filter(r => !activeRoomIds.has(r.id) && r.status !== 'Dalam Perawatan');
    const maintenance = (rooms || []).filter(r => r.status === 'Dalam Perawatan');
    
    return {
      availableRooms: available,
      pendingBookings: pending,
      activeBookings: active,
      maintenanceRooms: maintenance
    };
  }, [rooms, roomBookings]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Alasan pembatalan harus diisi');
      return;
    }
    
    try {
      await cancelRoomBooking(selectedBooking.id, cancelReason);
      toast.success('Pemesanan ruangan berhasil dibatalkan');
      setSelectedBooking(null);
      setCancelReason('');
    } catch (error) {
      toast.error('Gagal membatalkan pemesanan');
    }
  };

  const getRoomDisplayName = (data, booking) => {
    if (data?.kode) return data.kode;
    if (data?.name) return data.name;
    if (booking?.roomName) return booking.roomName;
    const rawId = String(data?.id || booking?.roomId || booking?.id || '');
    const numOnly = rawId.replace(/\D/g, '');
    const shortNum = numOnly ? (numOnly.length > 2 ? numOnly.slice(-2) : numOnly) : '01';
    return `RM-${shortNum}`;
  };

  const RoomSlot = ({ data, type, booking }) => {
    const isClickable = type === 'pending' || type === 'active';
    const roomName = getRoomDisplayName(data, booking);
    
    return (
      <div 
        className={`rcc-room-slot rcc-slot-${type}`} 
        onClick={() => isClickable && booking && setSelectedBooking(booking)}
      >
        <div className="rcc-slot-icon">
          {type === 'maintenance' ? <Wrench size={36} /> : <DoorOpen size={type === 'pending' ? 42 : 36} />}
          {type === 'active' && <div className="rcc-beacon"></div>}
        </div>
        <div className="rcc-slot-label" title={roomName}>{roomName}</div>
        {type === 'pending' && booking && (
          <span className="rcc-user-tag rcc-user-tag-pending">{booking.userName?.split(' ')[0]}</span>
        )}
        {type === 'active' && booking && (
          <span className="rcc-user-tag rcc-user-tag-active">{booking.userName?.split(' ')[0]}</span>
        )}
        
        <div className="rcc-tooltip">
          <div className="rcc-tooltip-header">{data?.name || booking?.roomName || 'Ruangan'}</div>
          {(data?.location || data?.lokasi) && <div className="rcc-tooltip-sub">{data.location || data.lokasi}</div>}
          {booking && (
            <div className="rcc-tooltip-body">
              <div className="rcc-tooltip-row"><span>Oleh:</span> <strong>{booking.userName}</strong></div>
              <div className="rcc-tooltip-row"><span>Untuk:</span> {booking.keperluan}</div>
              {booking.startTime && (
                <div className="rcc-tooltip-row"><span>Waktu:</span> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}</div>
              )}
            </div>
          )}
          {type === 'maintenance' && (
            <div className="rcc-tooltip-body">
              <div className="rcc-tooltip-row" style={{ color: 'var(--color-warning, #f59e0b)' }}>Dalam Perawatan</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rcc-container">
      <div className="rcc-header-bar" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="rcc-header-title">
          <Building2 size={20} className="text-primary-500" />
          <h3 className="text-lg font-semibold m-0">Status Ruangan Meeting</h3>
        </div>
        <div className="rcc-header-actions">
          <Badge variant="outline" className="mr-3 bg-white/50 dark:bg-slate-800/50">
            {availableRooms.length} Tersedia
          </Badge>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
            <ChevronDown size={20} className="text-slate-500" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            className="rcc-content-wrapper"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="rcc-dashboard-grid">
              
              {/* Zone 1: Ruang Tersedia */}
              <div className="rcc-zone rcc-zone-available">
                <div className="rcc-zone-scan-line"></div>
                <div className="rcc-zone-header">
                  <div className="flex items-center gap-2">
                    <Building2 size={18} />
                    <span className="font-medium">Ruang Tersedia</span>
                  </div>
                </div>
                <div className="rcc-zone-body">
                  {availableRooms.length === 0 && maintenanceRooms.length === 0 ? (
                    <div className="rcc-empty-state">
                      <Building2 size={32} />
                      <p>Semua ruangan sedang terpakai</p>
                    </div>
                  ) : (
                    <div className="rcc-slots-grid">
                      {availableRooms.map(room => (
                        <RoomSlot key={room.id} data={room} type="available" />
                      ))}
                      {maintenanceRooms.map(room => (
                        <RoomSlot key={room.id} data={room} type="maintenance" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="rcc-zone-footer">
                  Tersedia: {availableRooms.length}
                </div>
              </div>

              {/* Zone 2: Menunggu Persetujuan */}
              <div className="rcc-zone rcc-zone-pending">
                <div className="rcc-zone-gate-borders"></div>
                <div className="rcc-zone-header">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={18} className="text-amber-500" />
                    <span className="font-medium text-amber-700 dark:text-amber-400">Menunggu Persetujuan</span>
                  </div>
                </div>
                <div className="rcc-zone-body">
                  {pendingBookings.length === 0 ? (
                    <div className="rcc-empty-state rcc-empty-pending">
                      <PackageCheck size={32} />
                      <p>Tidak ada antrean</p>
                    </div>
                  ) : (
                    <div className="rcc-slots-grid">
                      {pendingBookings.map(booking => {
                        const room = rooms?.find(r => r.id === booking.roomId);
                        return <RoomSlot key={booking.id} data={room} booking={booking} type="pending" />;
                      })}
                    </div>
                  )}
                </div>
                <div className="rcc-zone-footer text-amber-700 dark:text-amber-400">
                  Persetujuan: {pendingBookings.length}
                </div>
              </div>

              {/* Zone 3: Sedang Digunakan */}
              <div className="rcc-zone rcc-zone-active">
                <div className="rcc-zone-header">
                  <div className="flex items-center gap-2">
                    <DoorOpen size={18} className="text-indigo-500" />
                    <span className="font-medium text-indigo-700 dark:text-indigo-400">Sedang Digunakan</span>
                  </div>
                </div>
                <div className="rcc-zone-body">
                  {activeBookings.length === 0 ? (
                    <div className="rcc-empty-state rcc-empty-active">
                      <DoorOpen size={32} />
                      <p>Tidak ada ruangan terpakai</p>
                    </div>
                  ) : (
                    <div className="rcc-slots-grid">
                      {activeBookings.map(booking => {
                        const room = rooms?.find(r => r.id === booking.roomId);
                        return <RoomSlot key={booking.id} data={room} booking={booking} type="active" />;
                      })}
                    </div>
                  )}
                </div>
                <div className="rcc-zone-footer text-indigo-700 dark:text-indigo-400">
                  Aktif: {activeBookings.length}
                </div>
              </div>
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal 
        isOpen={!!selectedBooking} 
        onClose={() => {
          setSelectedBooking(null);
          setCancelReason('');
        }}
        title="Detail Pemesanan Ruangan"
        size="md"
      >
        {selectedBooking && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400 mb-1">Ruangan</p>
                <p className="font-medium">{selectedBooking.roomName || 'Ruangan'}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 mb-1">Status</p>
                <Badge variant={
                  selectedBooking.status === 'Pending' ? 'warning' :
                  selectedBooking.status === 'Disetujui' || selectedBooking.status === 'Sedang Digunakan' ? 'success' : 'secondary'
                }>
                  {selectedBooking.status}
                </Badge>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 mb-1">Pegawai</p>
                <p className="font-medium">{selectedBooking.userName}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 mb-1">Waktu</p>
                <p className="font-medium">
                  {formatDateShort(selectedBooking.startTime)}<br/>
                  {formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500 dark:text-slate-400 mb-1">Keperluan</p>
                <p className="font-medium">{selectedBooking.keperluan}</p>
              </div>
              {selectedBooking.peserta && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400 mb-1">Peserta</p>
                  <p className="font-medium flex items-center gap-1">
                    <Users size={14} /> {selectedBooking.peserta} Orang
                  </p>
                </div>
              )}
              {selectedBooking.catatan && (
                <div className="col-span-2">
                  <p className="text-slate-500 dark:text-slate-400 mb-1">Catatan</p>
                  <p className="text-sm p-2 bg-slate-50 dark:bg-slate-800 rounded">{selectedBooking.catatan}</p>
                </div>
              )}
            </div>

            {/* Cancel Action - for Active or Pending (if they own it) or admin */}
            {(selectedBooking.status === 'Pending' || selectedBooking.status === 'Disetujui' || selectedBooking.status === 'Sedang Digunakan') && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                <FormInput
                  label="Alasan Pembatalan (Opsional)"
                  type="textarea"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Masukkan alasan jika ingin membatalkan..."
                  rows={2}
                />
                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedBooking(null);
                      setCancelReason('');
                    }}
                  >
                    Tutup
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={handleCancel}
                  >
                    Batalkan Pesanan
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RoomCommandCenter;
