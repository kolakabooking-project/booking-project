/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useCallback, useEffect, useRef, useMemo } from 'react';
import { Realtime } from 'ably';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { roomApi, roomBookingApi } from '../lib/api';
import { useAuth } from './AuthContext';

const RoomBookingContext = createContext(null);

export function RoomBookingProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // ─── TanStack Queries (Server Cache) ───

  const roomsQuery = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await roomApi.getAll();
      return res?.data || [];
    },
    enabled: isAuthenticated,
  });

  const roomBookingsQuery = useQuery({
    queryKey: ['roomBookings'],
    queryFn: async () => {
      const res = await roomBookingApi.getAll({});
      return res?.data || [];
    },
    enabled: isAuthenticated,
  });

  const rooms = useMemo(() => roomsQuery.data || [], [roomsQuery.data]);
  const roomBookings = useMemo(() => roomBookingsQuery.data || [], [roomBookingsQuery.data]);

  const isLoading = roomsQuery.isLoading || roomBookingsQuery.isLoading;

  // ─── Invalidation helpers ───

  const refreshRooms = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['rooms'] });
  }, [queryClient]);

  const refreshRoomBookings = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['roomBookings'] });
  }, [queryClient]);

  // ─── Real-Time Ably Subscription ───
  const ablyRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && !ablyRef.current) {
      const realtime = new Realtime({
        authCallback: async (tokenParams, callback) => {
          try {
            const response = await fetch('/api/ably/auth', { credentials: 'include' });
            if (!response.ok) throw new Error('Ably auth failed');
            const tokenRequest = await response.json();
            callback(null, tokenRequest);
          } catch (err) {
            callback(err, null);
          }
        }
      });

      const channel = realtime.channels.get('room-bookings');
      channel.subscribe('update', (message) => {
        const { type, booking } = message.data;
        
        if (!booking) {
          refreshRoomBookings();
          return;
        }

        if (type === 'ROOM_BOOKING_CREATED') {
          queryClient.setQueryData(['roomBookings'], (old) => {
            const current = old || [];
            if (current.some(b => b.id === booking.id)) return current;
            return [booking, ...current];
          });
          refreshRooms(); // status update for room
        } else if (['ROOM_BOOKING_CANCELLED', 'ROOM_REVIEW_SUBMITTED'].includes(type)) {
          queryClient.setQueryData(['roomBookings'], (old) => {
            const current = old || [];
            return current.map(b => b.id === booking.id ? booking : b);
          });
          refreshRooms();
        } else {
          refreshRoomBookings();
        }
      });

      ablyRef.current = realtime;
    }

    if (!isAuthenticated && ablyRef.current) {
      ablyRef.current.close();
      ablyRef.current = null;
    }
  }, [isAuthenticated, queryClient, refreshRoomBookings, refreshRooms]);

  // ─── Room Booking Actions ───

  const MIN_LOADING_MS = 600;
  const minDelay = () => new Promise((r) => setTimeout(r, MIN_LOADING_MS));

  const createRoomBooking = useCallback(async (bookingData) => {
    const [res] = await Promise.all([roomBookingApi.create(bookingData), minDelay()]);
    refreshRoomBookings();
    refreshRooms();
    return res?.data;
  }, [refreshRoomBookings, refreshRooms]);

  const createMandatoryRoomBooking = useCallback(async (bookingData) => {
    const [res] = await Promise.all([roomBookingApi.createMandatory(bookingData), minDelay()]);
    refreshRoomBookings();
    refreshRooms();
    return res?.data;
  }, [refreshRoomBookings, refreshRooms]);

  const cancelRoomBooking = useCallback(async (bookingId, alasan) => {
    await Promise.all([roomBookingApi.cancel(bookingId, alasan), minDelay()]);
    refreshRoomBookings();
    refreshRooms();
  }, [refreshRoomBookings, refreshRooms]);

  const submitRoomReview = useCallback(async (bookingId, notes) => {
    await Promise.all([roomBookingApi.submitReview(bookingId, notes), minDelay()]);
    refreshRoomBookings();
  }, [refreshRoomBookings]);

  const markRoomReviewAsRead = useCallback(async (bookingId) => {
    await Promise.all([roomBookingApi.markReviewRead(bookingId), minDelay()]);
    refreshRoomBookings();
  }, [refreshRoomBookings]);

  // ─── Room Actions ───

  const addRoom = useCallback(async (roomData) => {
    const res = await roomApi.create(roomData);
    await refreshRooms();
    return res?.data;
  }, [refreshRooms]);

  const updateRoom = useCallback(async (roomId, updates) => {
    const res = await roomApi.update(roomId, updates);
    await refreshRooms();
    return res?.data;
  }, [refreshRooms]);

  const deleteRoom = useCallback(async (roomId) => {
    await roomApi.delete(roomId);
    await refreshRooms();
  }, [refreshRooms]);
  
  const uploadRoomPhoto = useCallback(async (roomId, file) => {
    const res = await roomApi.uploadPhoto(roomId, file);
    await refreshRooms();
    return res?.data;
  }, [refreshRooms]);

  // ─── Query Helpers ───

  const getRoomBookingsForDate = useCallback(
    (date) => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      return roomBookings.filter((b) => {
        if (b.status === 'Dibatalkan') return false;
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        return start <= dayEnd && end >= dayStart;
      });
    },
    [roomBookings]
  );

  const getAvailableRooms = useCallback(
    (startTime, endTime) => {
      const bookedRoomIds = roomBookings
        .filter((b) => {
          if (['Dibatalkan', 'Selesai', 'Selesai dengan Catatan'].includes(b.status)) return false;
          const bStart = new Date(b.startTime);
          const bEnd = new Date(b.endTime);
          const rStart = new Date(startTime);
          const rEnd = new Date(endTime);
          return bStart < rEnd && bEnd > rStart;
        })
        .map((b) => b.roomId)
        .filter(Boolean);

      return rooms.filter(
        (r) => r.status !== 'Dalam Perawatan' && !bookedRoomIds.includes(r.id)
      );
    },
    [roomBookings, rooms]
  );

  const getUserRoomBookings = useCallback(
    (userId) => roomBookings.filter((b) => b.userId === userId),
    [roomBookings]
  );

  const getRoomReviewNotifications = useCallback(
    () => roomBookings.filter((b) => b.isNewReview),
    [roomBookings]
  );

  return (
    <RoomBookingContext.Provider
      value={{
        rooms,
        roomBookings,
        isLoading,
        createRoomBooking,
        createMandatoryRoomBooking,
        cancelRoomBooking,
        submitRoomReview,
        markRoomReviewAsRead,
        addRoom,
        updateRoom,
        deleteRoom,
        uploadRoomPhoto,
        getRoomBookingsForDate,
        getAvailableRooms,
        getUserRoomBookings,
        getRoomReviewNotifications,
        refreshRooms,
        refreshRoomBookings,
      }}
    >
      {children}
    </RoomBookingContext.Provider>
  );
}

export function useRoomBooking() {
  const ctx = useContext(RoomBookingContext);
  if (!ctx) throw new Error('useRoomBooking must be used within RoomBookingProvider');
  return ctx;
}
