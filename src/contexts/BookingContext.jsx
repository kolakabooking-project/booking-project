/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useCallback, useEffect, useRef, useMemo } from 'react';
import { Realtime } from 'ably';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingApi, vehicleApi, driverApi } from '../lib/api';
import { useAuth } from './AuthContext';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // ─── TanStack Queries (Server Cache) ───

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await vehicleApi.getAll();
      return res?.data || [];
    },
    enabled: isAuthenticated,
  });

  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const res = await driverApi.getAll();
      return res?.data || [];
    },
    enabled: isAuthenticated,
  });

  const bookingsQuery = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await bookingApi.getAll();
      return res?.data || [];
    },
    enabled: isAuthenticated,
  });

  // Expose arrays or default to empty lists
  const bookings = useMemo(() => bookingsQuery.data || [], [bookingsQuery.data]);
  const vehicles = useMemo(() => vehiclesQuery.data || [], [vehiclesQuery.data]);
  const drivers = useMemo(() => driversQuery.data || [], [driversQuery.data]);

  const isLoading = bookingsQuery.isLoading || vehiclesQuery.isLoading || driversQuery.isLoading;

  // ─── Invalidation helpers (Syncs cache on demand) ───

  const refreshBookings = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['bookings'] });
  }, [queryClient]);

  const refreshVehicles = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
  }, [queryClient]);

  const refreshDrivers = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['drivers'] });
  }, [queryClient]);

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
        console.log('[ABLY] Realtime Update received:', message.data);
        const { type, booking } = message.data;
        
        if (!booking) {
          refreshBookings();
          return;
        }

        // Intelligently mutate the server cache directly for zero-delay optimistic UI updates
        if (type === 'BOOKING_CREATED') {
          queryClient.setQueryData(['bookings'], (old) => {
            const current = old || [];
            if (current.some(b => b.id === booking.id)) return current;
            return [booking, ...current];
          });
        } else if (['BOOKING_APPROVED', 'BOOKING_REJECTED', 'BOOKING_CANCELLED', 'REVIEW_SUBMITTED'].includes(type)) {
          queryClient.setQueryData(['bookings'], (old) => {
            const current = old || [];
            return current.map(b => b.id === booking.id ? booking : b);
          });
          // Invalidate vehicles and drivers in case status/availability changed
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          queryClient.invalidateQueries({ queryKey: ['drivers'] });
        } else {
          refreshBookings();
        }
      });

      ablyRef.current = realtime;
    }

    // Cleanup Ably subscription when auth state ends
    if (!isAuthenticated && ablyRef.current) {
      ablyRef.current.close();
      ablyRef.current = null;
    }
  }, [isAuthenticated, queryClient, refreshBookings, refreshVehicles]);

  // ─── Booking Actions ───
  // Pattern: await the mutation (must succeed), then trigger background refresh.
  // Ably real-time subscription (line 85-111) provides instant optimistic cache updates.
  // Background refreshes are fire-and-forget for eventual consistency.

  const createBooking = useCallback(async (bookingData) => {
    const res = await bookingApi.create(bookingData);
    refreshBookings();
    return res?.data;
  }, [refreshBookings]);

  const createMandatoryBooking = useCallback(async (bookingData) => {
    const res = await bookingApi.createMandatory(bookingData);
    refreshBookings();
    return res?.data;
  }, [refreshBookings]);

  const cancelBooking = useCallback(async (bookingId) => {
    await bookingApi.cancel(bookingId);
    refreshBookings();
  }, [refreshBookings]);

  const approveBooking = useCallback(async (bookingId, vehicleId, driverId) => {
    await bookingApi.approve(bookingId, vehicleId, driverId);
    refreshBookings();
    refreshVehicles();
  }, [refreshBookings, refreshVehicles]);

  const rejectBooking = useCallback(async (bookingId, alasan) => {
    await bookingApi.reject(bookingId, alasan);
    refreshBookings();
  }, [refreshBookings]);

  const submitReview = useCallback(async (bookingId, notes) => {
    await bookingApi.submitReview(bookingId, notes);
    refreshBookings();
  }, [refreshBookings]);

  const markReviewAsRead = useCallback(async (bookingId) => {
    await bookingApi.markReviewRead(bookingId);
    refreshBookings();
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

      // Hanya exclude kendaraan yang sedang dalam perawatan (status DB asli).
      // Jangan exclude berdasarkan status computed 'Sedang Dipakai' dari getAllVehicles,
      // karena 'Sedang Dipakai' hanya berarti dipakai SEKARANG — bukan berarti
      // tidak tersedia di waktu lain. Overlap waktu sudah ditangani oleh bookedVehicleIds.
      return vehicles.filter(
        (v) => v.status !== 'Dalam Perawatan' && !bookedVehicleIds.includes(v.id)
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

      // Hanya exclude pengemudi yang sedang libur.
      // Status 'Bertugas' adalah computed real-time, bukan status permanen.
      return drivers.filter(
        (d) => d.status !== 'Libur' && !busyDriverIds.includes(d.id)
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
