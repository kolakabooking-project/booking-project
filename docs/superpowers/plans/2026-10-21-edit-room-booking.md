# Edit Room Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable Admin and Sekretaris (with admin privileges) to edit active room bookings from the Detail action in the Room Request Board (`/admin/room/requests`), updating the booking in-place, logging a new audit event (`ROOM_BOOKING_UPDATED`), and broadcasting changes realtime via Ably.

**Architecture:** Add `'ROOM_BOOKING_UPDATED'` action to activity log enum; implement `updateRoomBooking` in `room-booking.service.ts` with collision detection that ignores the current booking ID; expose `PUT /api/room-bookings/:id` guarded by `roleGuard('admin')`; update `RoomBookingContext.jsx` and `api.js` to support update mutations and Ably cache updates; create `EditRoomBookingModal.jsx` with pre-filled values and integrate it into `RequestBoardPage.jsx`.

**Tech Stack:** React 19, TypeScript, Express, Drizzle ORM, PostgreSQL, Ably Realtime, TanStack Query, Tailwind CSS, Lucide icons, Sonner toast.

---

### Task 1: Skema Database & Audit Log Action Config

**Files:**
- Modify: `server/src/db/schema.ts:219-222`
- Modify: `src/utils/actionConfig.js:180-200`

- [ ] **Step 1: Add `ROOM_BOOKING_UPDATED` to `activity_log` action enum in `server/src/db/schema.ts`**

Add `'ROOM_BOOKING_UPDATED'` right after `'ROOM_BOOKING_CREATED'`:
```typescript
// Room Booking
'ROOM_BOOKING_CREATED', 'ROOM_BOOKING_UPDATED', 'ROOM_BOOKING_CANCELLED', 'ROOM_BOOKING_REVIEW',
```

- [ ] **Step 2: Add visual configuration for `ROOM_BOOKING_UPDATED` in `src/utils/actionConfig.js`**

Import `FileEdit` (or use existing icons) and add:
```javascript
  ROOM_BOOKING_UPDATED: {
    icon: FileEdit,
    label: 'Booking Ruangan Diperbarui',
    iconClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-500/8 dark:bg-blue-500/15 border border-blue-500/15 dark:border-blue-400/20',
    badgeClass: 'text-blue-700 dark:text-blue-300 bg-blue-500/8 dark:bg-blue-500/15',
  },
```

- [ ] **Step 3: Run builds to verify schema and frontend config compile**

Run: `npm run build` in root and `npm run build` in `server`.
Expected: Both exit with code 0.

- [ ] **Step 4: Commit changes**

```bash
git add server/src/db/schema.ts src/utils/actionConfig.js
git commit -m "feat(room-booking): add ROOM_BOOKING_UPDATED to schema and actionConfig"
```

---

### Task 2: Backend Service `updateRoomBooking`

**Files:**
- Modify: `server/src/services/room-booking.service.ts`

- [ ] **Step 1: Implement `updateRoomBooking` in `server/src/services/room-booking.service.ts`**

Input interface:
```typescript
interface UpdateRoomBookingInput {
  roomId: string;
  startTime: string | Date;
  endTime: string | Date;
  keperluan: string;
  jumlahPeserta: number;
  catatan?: string | null;
  userId?: string; // target pegawai if modified
}
```

Validation & logic:
1. Fetch existing booking by `bookingId`. If not found, throw `NotFoundError('Peminjaman Ruangan')`.
2. Check status: if not in `['Disetujui', 'Berlangsung']`, throw `ValidationError('Hanya peminjaman aktif yang dapat diedit.')`.
3. Check time: if `new Date() >= new Date(target.endTime)`, throw `ValidationError('Peminjaman yang waktunya sudah terlewat tidak dapat diubah.')`.
4. Validate `startTime < endTime`.
5. Check collision in `roomBooking` where:
   - `roomId == data.roomId`
   - `id != bookingId`
   - `status in ['Disetujui', 'Berlangsung']`
   - `startTime < newEndTime` and `endTime > newStartTime`
   If collision found, throw `ValidationError('Ruangan sudah dibooking pada waktu tersebut. Silakan pilih waktu atau ruangan lain.')`.
6. Update `roomBooking` record:
   `roomId`, `startTime`, `endTime`, `keperluan`, `jumlahPeserta`, `catatan`, and optionally `userId` (if provided).
   Set `updatedAt = new Date()`.
7. Broadcast `ROOM_BOOKING_UPDATED` via Ably:
   ```typescript
   broadcastBookingUpdate('ROOM_BOOKING_UPDATED', { booking: fullBooking }, 'room-bookings')
   ```
8. Send notification to the user if updated by admin.
9. Return `fullBooking`.

- [ ] **Step 2: Verify `updateRoomBooking` compiles**

Run: `npm run build` in `server`.
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit changes**

```bash
git add server/src/services/room-booking.service.ts
git commit -m "feat(room-booking): implement updateRoomBooking service function"
```

---

### Task 3: Backend Route `PUT /api/room-bookings/:id`

**Files:**
- Modify: `server/src/routes/room-booking.routes.ts`

- [ ] **Step 1: Add `PUT /api/room-bookings/:id` route in `server/src/routes/room-booking.routes.ts`**

```typescript
/**
 * PUT /api/room-bookings/:id — Update active room booking (Admin / Sekretaris)
 */
router.put('/:id', roleGuard('admin'), async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    const booking = await roomBookingService.updateRoomBooking(
      req.params.id as string,
      req.body,
      actor
    );

    res.json({ data: booking });

    logActivity({
      userId: actor.id,
      userName: actor.name,
      action: 'ROOM_BOOKING_UPDATED',
      targetId: booking.id,
      targetName: `Peminjaman Ruangan: ${booking.keperluan}`,
      detail: `${actor.role === 'sekretaris' ? 'Sekretaris' : 'Admin'} memperbarui peminjaman ruangan: ${booking.roomName}`,
      ipAddress: (Array.isArray(req.ip) ? req.ip[0] : req.ip) || undefined,
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ error: err.message });
  }
});
```

- [ ] **Step 2: Verify route compiles**

Run: `npm run build` in `server`.
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit changes**

```bash
git add server/src/routes/room-booking.routes.ts
git commit -m "feat(room-booking): expose PUT /api/room-bookings/:id endpoint"
```

---

### Task 4: Frontend API Client & RoomBookingContext

**Files:**
- Modify: `src/lib/api.js:231-254`
- Modify: `src/contexts/RoomBookingContext.jsx`

- [ ] **Step 1: Add `update` method to `roomBookingApi` in `src/lib/api.js`**

```javascript
update: (id, data) =>
  request(`/room-bookings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
```

- [ ] **Step 2: Add `updateRoomBooking` in `src/contexts/RoomBookingContext.jsx`**

```javascript
  const updateRoomBooking = useCallback(async (bookingId, bookingData) => {
    const [res] = await Promise.all([roomBookingApi.update(bookingId, bookingData), minDelay()]);
    if (res?.data) {
      queryClient.setQueryData(['roomBookings'], (old) => {
        const current = old || [];
        return current.map(b => b.id === bookingId ? res.data : b);
      });
    }
    refreshRooms();
    return res?.data;
  }, [queryClient, refreshRooms]);
```

- [ ] **Step 3: Handle `ROOM_BOOKING_UPDATED` in the Ably subscription in `RoomBookingContext.jsx`**

Update line 86 to include `'ROOM_BOOKING_UPDATED'`:
```javascript
} else if (['ROOM_BOOKING_CANCELLED', 'ROOM_REVIEW_SUBMITTED', 'ROOM_BOOKING_UPDATED'].includes(type)) {
  queryClient.setQueryData(roomBookingQueryKey, (old) => {
    const current = old || [];
    return current.map(b => b.id === booking.id ? booking : b);
  });
  refreshRooms();
}
```

- [ ] **Step 4: Expose `updateRoomBooking` in `RoomBookingContext.Provider` value**

- [ ] **Step 5: Run frontend build to verify compilation**

Run: `npm run build` in root.
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit changes**

```bash
git add src/lib/api.js src/contexts/RoomBookingContext.jsx
git commit -m "feat(room-booking): add updateRoomBooking context and api method"
```

---

### Task 5: Component `EditRoomBookingModal.jsx`

**Files:**
- Create: `src/components/admin/room/EditRoomBookingModal.jsx`

- [ ] **Step 1: Create `src/components/admin/room/EditRoomBookingModal.jsx`**

Features:
- `isOpen`, `onClose`, `booking` props
- Form state initialized from `booking`:
  - `startDate`, `startTime`, `endTime`, `roomId`, `keperluan`, `jumlahPeserta`, `catatan`
  - `selectedPegawai` initialized with `{ id: booking.userId, name: booking.userName }`
  - Pegawai search and switch capability (using `bookingApi.getPegawaiList()`)
  - Room dropdown selector from `useRoomBooking().rooms`
  - CounterInput for `jumlahPeserta`
  - Collision check warning helper or validation before submit
  - Submit button with loading state calling `updateRoomBooking(booking.id, payload)`
  - Toast notifications and close modal on success

- [ ] **Step 2: Run frontend build to verify component has no syntax or lint errors**

Run: `npm run build` in root.
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit component**

```bash
git add src/components/admin/room/EditRoomBookingModal.jsx
git commit -m "feat(room-booking): create EditRoomBookingModal component"
```

---

### Task 6: Integrasi pada `RequestBoardPage.jsx`

**Files:**
- Modify: `src/pages/admin/room/RequestBoardPage.jsx`

- [ ] **Step 1: Import `EditRoomBookingModal`, `useAuth`, and `Edit` icon**

```javascript
import { useAuth } from '../../../contexts/AuthContext';
import EditRoomBookingModal from '../../../components/admin/room/EditRoomBookingModal';
import { Edit } from 'lucide-react';
```

- [ ] **Step 2: Add `editingBooking` state and permissions check**

```javascript
const { user, activeRole } = useAuth();
const [editingBooking, setEditingBooking] = useState(null);

const canManageBooking = ['admin', 'sekretaris', 'superadmin'].includes(user?.role) ||
                         ['admin', 'sekretaris', 'superadmin'].includes(activeRole);
```

- [ ] **Step 3: Add `Edit Booking` button in detail modal**

Beside "Batalkan Booking":
```jsx
{canManageBooking && (
  <Button
    variant="secondary"
    onClick={() => setEditingBooking(modal)}
    className="shadow-sm border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500/50"
  >
    <Edit size={16} /> Edit Booking
  </Button>
)}
```

- [ ] **Step 4: Render `EditRoomBookingModal`**

```jsx
<EditRoomBookingModal
  isOpen={!!editingBooking}
  onClose={() => setEditingBooking(null)}
  booking={editingBooking}
  onSuccess={(updatedBooking) => {
    setModal(updatedBooking);
    setEditingBooking(null);
  }}
/>
```

- [ ] **Step 5: Run frontend build**

Run: `npm run build` in root.
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit changes**

```bash
git add src/pages/admin/room/RequestBoardPage.jsx
git commit -m "feat(room-booking): integrate Edit Booking button and modal in RequestBoardPage"
```

---

### Task 7: Pengujian, Verifikasi & Audit Log Check

**Files:**
- Create scratch test script: `server/test-update-room-booking.ts` (or run validation tests)

- [ ] **Step 1: Run end-to-end service test script with tsx**

Test cases to verify:
1. Booking update succeeds with new time/room.
2. Self-collision (editing notes/participants without moving time) does NOT trigger collision error.
3. Collision with another active booking correctly triggers collision error.
4. Booking past end time rejects with validation error.
5. `activity_log` record with `'ROOM_BOOKING_UPDATED'` is created.
6. Clean up any temporary test files.

- [ ] **Step 2: Run both frontend and backend builds**

Run: `npm run build` in root and `npm run build` in `server`.
Expected: Both pass with 0 errors.

- [ ] **Step 3: Final git commit and status check**
