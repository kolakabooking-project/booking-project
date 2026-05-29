import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useBooking } from '../contexts/BookingContext';
import { useLoading } from '../contexts/LoadingContext';
import { BOOKING_STATUS } from '../utils/constants';

export default function useRequestBoard(itemsPerPage = 10) {
  const { bookings, approveBooking, rejectBooking } = useBooking();
  const { showLoading, hideLoading } = useLoading();
  const location = useLocation();
  const navigate = useNavigate();

  // UI States
  const [activeTab, setActiveTab] = useState('aktif'); // 'aktif' or 'riwayat'
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [modal, setModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    if (location.state?.openBookingId) {
      const b = bookings.find((b) => b.id === location.state.openBookingId);
      if (b) {
        setModal(b);
        setRejectReason('');
        setShowReject(false);
        if ([BOOKING_STATUS.COMPLETED, BOOKING_STATUS.REJECTED].includes(b.status)) {
          setActiveTab('riwayat');
        } else {
          setActiveTab('aktif');
        }
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openBookingId, bookings, navigate, location.pathname]);

  const filteredBookings = useMemo(() => {
    let list = bookings;

    // 1. Filter by Tab
    if (activeTab === 'aktif') {
      list = list.filter((b) =>
        [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED, BOOKING_STATUS.ONGOING].includes(b.status)
      );
    } else {
      list = list.filter((b) =>
        [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.COMPLETED_WITH_NOTES, BOOKING_STATUS.REJECTED].includes(b.status)
      );
    }

    // 2. Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((b) =>
        b.userName?.toLowerCase().includes(query) ||
        b.id.toLowerCase().includes(query) ||
        (b.vehicleName && b.vehicleName.toLowerCase().includes(query))
      );
    }

    // 3. Filter by Date Range
    if (dateFilter) {
      list = list.filter((b) => b.startTime.startsWith(dateFilter));
    }

    // Sort by startTime
    return list.sort((a, b) => {
      const dateA = new Date(a.startTime);
      const dateB = new Date(b.startTime);
      return activeTab === 'aktif' ? dateA - dateB : dateB - dateA;
    });
  }, [bookings, activeTab, searchQuery, dateFilter]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const currentData = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openModal = useCallback((booking) => {
    setModal(booking);
    setRejectReason('');
    setShowReject(false);
  }, []);

  const handleApprove = async () => {
    if (!modal) return;
    if (!modal.vehicleId) { 
      toast.error('Kendaraan belum dipilih oleh pengguna'); 
      return; 
    }
    
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
    if (!rejectReason.trim()) { 
      toast.error('Masukkan alasan penolakan'); 
      return; 
    }
    
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

  return {
    state: {
      activeTab,
      searchQuery,
      dateFilter,
      currentPage,
      modal,
      rejectReason,
      showReject,
      filteredBookings,
      currentData,
      totalPages
    },
    actions: {
      setActiveTab,
      setSearchQuery,
      setDateFilter,
      setCurrentPage,
      setModal,
      setRejectReason,
      setShowReject,
      openModal,
      handleApprove,
      handleReject
    }
  };
}
