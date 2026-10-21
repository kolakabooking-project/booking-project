# Design Spec: Fitur Edit Booking Ruangan untuk Admin & Sekretaris

## Ringkasan Eksekutif
Fitur ini memungkinkan pengguna dengan peran (role) **Admin** dan **Sekretaris** (dalam mode Admin/operasional) untuk mengubah data peminjaman ruangan yang sedang aktif langsung dari modal detail di halaman Monitoring Booking Ruangan (`/admin/room/requests`). Ketika pembaruan disimpan, sistem akan langsung memperbarui data peminjaman secara *in-place* di database, mencatat entri log aktivitas audit baru (`ROOM_BOOKING_UPDATED`), dan menyinkronkan data secara realtime via Ably tanpa mengubah atau menghapus rekaman log historis lama.

---

## 1. Arsitektur & Otorisasi

### 1.1 Kontrol Akses Berbasis Peran (RBAC)
* **Frontend:**
  * Tombol **Edit Booking** hanya ditampilkan jika pengguna memiliki peran berwenang:
    ```javascript
    const canManageBooking = ['admin', 'sekretaris', 'superadmin'].includes(user?.role) ||
                             ['admin', 'sekretaris', 'superadmin'].includes(activeRole);
    ```
* **Backend:**
  * Endpoint `PUT /api/room-bookings/:id` dilindungi oleh `authGuard`, `maintenanceGuard`, dan `roleGuard('admin')`.
  * Sesuai implementasi `server/src/middleware/roleGuard.ts`, `roleGuard('admin')` telah mengizinkan peran `admin`, `sekretaris`, dan `superadmin`.

---

## 2. Perubahan Skema & Model Data

### 2.1 Skema `activity_log` (`server/src/db/schema.ts`)
Tambahkan enum nilai aksi baru pada kolom `action` tabel `activity_log`:
```typescript
'ROOM_BOOKING_UPDATED'
```

### 2.2 Konfigurasi Ikon & Tampilan Aksi (`src/utils/actionConfig.js`)
Daftarkan konfigurasi visual untuk aksi `ROOM_BOOKING_UPDATED`:
```javascript
ROOM_BOOKING_UPDATED: {
  icon: FileEdit,
  label: 'Booking Ruangan Diperbarui',
  iconClass: 'text-blue-600 dark:text-blue-400',
  bgClass: 'bg-blue-500/8 dark:bg-blue-500/15 border border-blue-500/15 dark:border-blue-400/20',
  badgeClass: 'text-blue-700 dark:text-blue-300 bg-blue-500/8 dark:bg-blue-500/15',
}
```

---

## 3. Backend Implementation

### 3.1 Service Ruangan (`server/src/services/room-booking.service.ts`)
Fungsi `updateRoomBooking`:
```typescript
export async function updateRoomBooking(
  bookingId: string,
  data: {
    userId?: string;
    roomId: string;
    startTime: string | Date;
    endTime: string | Date;
    keperluan: string;
    jumlahPeserta?: number;
    catatan?: string | null;
  },
  actor: { id: string; name: string; role: string }
)
```

**Alur Validasi & Eksekusi:**
1. Cari record `room_booking` berdasarkan `bookingId`. Jika tidak ada, lemparkan `NotFoundError('Peminjaman Ruangan')`.
2. Validasi status: hanya status `'Disetujui'` atau `'Berlangsung'` yang dapat diedit. Jika status `'Selesai'` atau `'Dibatalkan'`, lemparkan `ValidationError`.
3. Validasi waktu: jika waktu peminjaman sudah selesai (`new Date() >= new Date(target.endTime)`), lemparkan `ValidationError('Peminjaman yang waktunya sudah terlewat tidak dapat diubah.')`.
4. Validasi input: `startTime < endTime`, format tanggal/waktu valid.
5. **Deteksi Bentrok Jadwal (*Collision Check*):**
   ```typescript
   const overlapping = await db
     .select({ id: roomBooking.id })
     .from(roomBooking)
     .where(
       and(
         eq(roomBooking.roomId, data.roomId),
         not(eq(roomBooking.id, bookingId)), // Jangan bentrok dengan dirinya sendiri
         inArray(roomBooking.status, ['Disetujui', 'Berlangsung']),
         lt(roomBooking.startTime, endTime),
         gt(roomBooking.endTime, startTime)
       )
     );
   if (overlapping.length > 0) {
     throw new ValidationError('Ruangan sudah dibooking pada waktu tersebut. Silakan pilih waktu atau ruangan lain.');
   }
   ```
6. **In-place Update Data Peminjaman:**
   Perbarui tabel `room_booking` dengan field baru dan `updatedAt: new Date()`.
7. **Audit Log & Realtime:**
   * Catat aktivitas baru di `activity_log` (`action: 'ROOM_BOOKING_UPDATED'`).
   * Panggil `broadcastBookingUpdate('ROOM_BOOKING_UPDATED', { booking: fullBooking }, 'room-bookings')`.
   * Kirim notifikasi / push notification ke pegawai jika data peminjaman diubah oleh Admin/Sekretaris.

### 3.2 Endpoint Route (`server/src/routes/room-booking.routes.ts`)
* `PUT /api/room-bookings/:id`
  * Body: `roomId`, `startTime`, `endTime`, `keperluan`, `jumlahPeserta`, `catatan`, `targetUserId` (opsional jika ganti pegawai).
  * Menjalankan `updateRoomBooking`.

---

## 4. Frontend Implementation

### 4.1 API Client (`src/lib/api.js`)
Tambahkan method ke `roomBookingApi`:
```javascript
update: (id, data) => request(`/room-bookings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
```

### 4.2 RoomBookingContext (`src/contexts/RoomBookingContext.jsx`)
* Tambahkan `updateRoomBooking(bookingId, bookingData)`.
* Pastikan event Ably `ROOM_BOOKING_UPDATED` memperbarui TanStack Query cache secara in-place:
  ```javascript
  else if (['ROOM_BOOKING_CANCELLED', 'ROOM_REVIEW_SUBMITTED', 'ROOM_BOOKING_UPDATED'].includes(type)) {
    queryClient.setQueryData(roomBookingQueryKey, (old) => {
      const current = old || [];
      return current.map(b => b.id === booking.id ? booking : b);
    });
    refreshRooms();
  }
  ```

### 4.3 Modal Edit (`src/components/admin/room/EditRoomBookingModal.jsx`)
* Komponen modal terdedikasi berbasis `Modal.jsx`:
  * Pre-fill data peminjaman saat ini:
    * Pegawai peminjam (dengan opsi ganti / cari pegawai lain)
    * Ruangan
    * Tanggal peminjaman
    * Jam Mulai & Jam Selesai
    * Keperluan kegiatan
    * Jumlah Peserta
    * Catatan
  * Validasi ketersediaan lokal/slot jam sebelum kirim
  * Tombol Batal & Simpan Perubahan dengan loading spinner.

### 4.4 Integrasi Halaman (`src/pages/admin/room/RequestBoardPage.jsx`)
* Di dalam modal detail peminjaman (`Modal isOpen={!!modal}`):
  * Jika user berwenang (`canManageBooking`) dan booking masih aktif belum lewat:
    * Tampilkan tombol `Edit Booking` bersebelahan dengan tombol `Batalkan Booking`.
  * Saat `Edit Booking` diklik:
    * Buka `EditRoomBookingModal` dengan data `modal`.
    * Setelah sukses disimpan, tutup modal edit, perbarui state `modal` dengan data terbaru, dan munculkan notifikasi sukses via `toast.success`.

---

## 5. Rencana Pengujian (Testing)
1. **Pengecekan Izin Akses (RBAC):**
   * Login sebagai Admin: Tombol Edit tampil dan dapat menyimpan perubahan.
   * Login sebagai Sekretaris (mode Admin): Tombol Edit tampil dan dapat menyimpan perubahan.
   * Login sebagai User biasa: Tidak dapat mengakses halaman admin / endpoint PUT ditolak dengan status 403.
2. **Pengecekan Deteksi Bentrok:**
   * Edit booking ke jam/ruangan yang sudah dipakai peminjaman lain: Muncul pesan error bentrok.
   * Edit booking pada jam yang sama atau sedikit bergeser di ruangan yang sama: Tidak dianggap bentrok dengan dirinya sendiri dan berhasil disimpan.
3. **Pengecekan Log Aktivitas:**
   * Cek halaman `/superadmin/logs`: Terdapat log baru dengan tipe `ROOM_BOOKING_UPDATED` dan detail perubahan. Log lama `ROOM_BOOKING_CREATED` tetap utuh.
4. **Pengecekan Realtime Ably:**
   * Saat satu admin menyimpan perubahan, tampilan tabel booking di browser lain otomatis berubah tanpa reload.
