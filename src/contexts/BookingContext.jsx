/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Realtime } from 'ably';
import { bookingApi, vehicleApi, driverApi } from '../lib/api';
import { useAuth } from './AuthContext';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Track if initial data has been fetched
  const hasFetched = useRef(false);

  // ─── Data Fetching ───

  const fetchAllData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [vehiclesRes, driversRes] = await Promise.all([
        vehicleApi.getAll(),
        driverApi.getAll(),
      ]);
      setVehicles(vehiclesRes?.data || []);
      setDrivers(driversRes?.data || []);

      // Fetch all bookings globally so availability logic works and users can see schedules
      const bookingsRes = await bookingApi.getAll();
      setBookings(bookingsRes?.data || []);
    } catch (err) {
      console.error('[BookingContext] Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  // Fetch on mount and when auth state changes
  useEffect(() => {
    if (isAuthenticated && !hasFetched.current) {
      hasFetched.current = true;
      fetchAllData();
    }
    if (!isAuthenticated) {
      hasFetched.current = false;
      setBookings([]);
      setVehicles([]);
      setDrivers([]);
    }
  }, [isAuthenticated, fetchAllData]);

  // ─── Refresh helpers ───

  const refreshBookings = useCallback(async () => {
    try {
      // Always fetch all bookings to ensure availability calculations are accurate
      const res = await bookingApi.getAll();
      setBookings(res?.data || []);
    } catch (err) {
      console.error('[BookingContext] refreshBookings error:', err);
    }
  }, [user?.role]);

  const refreshVehicles = useCallback(async () => {
    try {
      const res = await vehicleApi.getAll();
      setVehicles(res?.data || []);
    } catch (err) {
      console.error('[BookingContext] refreshVehicles error:', err);
    }
  }, []);

  const refreshDrivers = useCallback(async () => {
    try {
      const res = await driverApi.getAll();
      setDrivers(res?.data || []);
    } catch (err) {
      console.error('[BookingContext] refreshDrivers error:', err);
    }
  }, []);

  // ─── Real-Time Ably Subscription ───
  const ablyRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && !ablyRef.current) {
      const realtime = new Realtime({
        authCallback: async (tokenParams, callback) => {
          try {
            const response = await fetch('/api/ably/auth', {
              credentials: 'include', // Send better-auth session cookies
            });
            if (!response.ok) throw new Error('Ably auth failed');
            const tokenRequest = await response.json();
            callback(null, tokenRequest);
          } catch (err) {
            callback(err, null);
          }
        }
      });

      const channel = realtime.channels.get('bookings');
      channel.subscribe('update', (message) => {
        console.log('[ABLY] Update received:', message.data);
        const { type, booking } = message.data;
        
        if (!booking) {
          // Fallback if payload is missing
          refreshBookings();
          return;
        }

        if (type === 'BOOKING_CREATED') {
          setBookings(prev => [booking, ...prev]);
        } else if (['BOOKING_APPROVED', 'BOOKING_REJECTED', 'BOOKING_CANCELLED', 'REVIEW_SUBMITTED'].includes(type)) {
          setBookings(prev => prev.map(b => b.id === booking.id ? booking : b));
        } else {
          refreshBookings();
        }
      });

      ablyRef.current = realtime;
    }

    // Cleanup when user logs out
    if (!isAuthenticated && ablyRef.current) {
      ablyRef.current.close();
      ablyRef.current = null;
    }
  }, [isAuthenticated, refreshBookings, refreshVehicles]);

  // ─── Booking Actions ───

  const createBooking = useCallback(async (bookingData) => {
    const res = await bookingApi.create(bookingData);
    await refreshBookings();
    return res?.data;
  }, [refreshBookings]);

  const createMandatoryBooking = useCallback(async (bookingData) => {
    const res = await bookingApi.createMandatory(bookingData);
    await refreshBookings();
    return res?.data;
  }, [refreshBookings]);

  const cancelBooking = useCallback(async (bookingId) => {
    await bookingApi.cancel(bookingId);
    await refreshBookings();
  }, [refreshBookings]);

  const approveBooking = useCallback(async (bookingId, vehicleId, driverId) => {
    await bookingApi.approve(bookingId, vehicleId, driverId);
    await Promise.all([refreshBookings(), refreshVehicles()]);
  }, [refreshBookings, refreshVehicles]);

  const rejectBooking = useCallback(async (bookingId, alasan) => {
    await bookingApi.reject(bookingId, alasan);
    await refreshBookings();
  }, [refreshBookings]);

  const submitReview = useCallback(async (bookingId, notes) => {
    await bookingApi.submitReview(bookingId, notes);
    await refreshBookings();
  }, [refreshBookings]);

  const markReviewAsRead = useCallback(async (bookingId) => {
    await bookingApi.markReviewRead(bookingId);
    await refreshBookings();
  }, [refreshBookings]);

  // ─── Vehicle Actions ───

  const addVehicle = useCallback(async (vehicleData) => {
    const res = await vehicleApi.create(vehicleData);
    await refreshVehicles();
    return res?.data;
  }, [refreshVehicles]);

  const updateVehicle = useCallback(async (vehicleId, updates) => {
    const res = await vehicleApi.update(vehicleId, updates);
    await refreshVehicles();
    return res?.data;
  }, [refreshVehicles]);

  const deleteVehicle = useCallback(async (vehicleId) => {
    await vehicleApi.delete(vehicleId);
    await refreshVehicles();
  }, [refreshVehicles]);

  // ─── Driver Actions ───

  const addDriver = useCallback(async (driverData) => {
    const res = await driverApi.create(driverData);
    await refreshDrivers();
    return res?.data;
  }, [refreshDrivers]);

  const updateDriver = useCallback(async (driverId, updates) => {
    const res = await driverApi.update(driverId, updates);
    await refreshDrivers();
    return res?.data;
  }, [refreshDrivers]);

  const deleteDriver = useCallback(async (driverId) => {
    await driverApi.delete(driverId);
    await refreshDrivers();
  }, [refreshDrivers]);

  // ─── Query Helpers ───
  // These maintain the same synchronous API surface the pages expect,
  // but now operate on server-fetched data.

  const getBookingsForDate = useCallback(
    (date) => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      return bookings.filter((b) => {
        if (['Ditolak', 'Dibatalkan'].includes(b.status)) return false;
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        return start <= dayEnd && end >= dayStart;
      });
    },
    [bookings]
  );

  const getAvailableVehicles = useCallback(
    (startTime, endTime) => {
      // Filter from locally cached data for instant UI feedback
      const bookedVehicleIds = bookings
        .filter((b) => {
          if (['Ditolak', 'Dibatalkan', 'Selesai', 'Selesai dengan Catatan'].includes(b.status)) return false;
          const bStart = new Date(b.startTime);
          const bEnd = new Date(b.endTime);
          const rStart = new Date(startTime);
          const rEnd = new Date(endTime);
          return bStart < rEnd && bEnd > rStart;
        })
        .map((b) => b.vehicleId)
        .filter(Boolean);

      return vehicles.filter(
        (v) => v.status === 'Tersedia' && !bookedVehicleIds.includes(v.id)
      );
    },
    [bookings, vehicles]
  );

  const getAvailableDrivers = useCallback(
    (startTime, endTime) => {
      const busyDriverIds = bookings
        .filter((b) => {
          if (['Ditolak', 'Dibatalkan', 'Selesai', 'Selesai dengan Catatan'].includes(b.status)) return false;
          const bStart = new Date(b.startTime);
          const bEnd = new Date(b.endTime);
          const rStart = new Date(startTime);
          const rEnd = new Date(endTime);
          return bStart < rEnd && bEnd > rStart;
        })
        .map((b) => b.driverId)
        .filter(Boolean);

      return drivers.filter(
        (d) => d.status === 'Tersedia' && !busyDriverIds.includes(d.id)
      );
    },
    [bookings, drivers]
  );

  const getUserBookings = useCallback(
    (userId) => bookings.filter((b) => b.userId === userId),
    [bookings]
  );

  const getPendingBookings = useCallback(
    () => bookings.filter((b) => b.status === 'Pending'),
    [bookings]
  );

  const getReviewNotifications = useCallback(
    () => bookings.filter((b) => b.isNewReview),
    [bookings]
  );

  return (
    <BookingContext.Provider
      value={{
        bookings,
        vehicles,
        drivers,
        isLoading,
        createBooking,
        createMandatoryBooking,
        cancelBooking,
        approveBooking,
        rejectBooking,
        submitReview,
        markReviewAsRead,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addDriver,
        updateDriver,
        deleteDriver,
        getBookingsForDate,
        getAvailableVehicles,
        getAvailableDrivers,
        getUserBookings,
        getPendingBookings,
        getReviewNotifications,
        refreshBookings,
        refreshVehicles,
        refreshDrivers,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}
