# Spesifikasi Desain: Perubahan Status Kendaraan "Dalam Perawatan" Menjadi "Tidak Tersedia"

## 1. Ringkasan
Dokumen ini mendefinisikan rancangan teknis untuk memperbarui label dan status kendaraan dari **"Dalam Perawatan"** menjadi **"Tidak Tersedia"** pada modul peminjaman mobil (Fleet Management & Booking), mencakup tampilan di antarmuka Admin maupun Pengguna Biasa (Pegawai). Modul Ruangan (Room Booking) tetap mempertahankan status bawaannya.

Pendekatan yang digunakan adalah **Dual-Compatible & Seamless Display**:
- Tampilan UI di Admin dan User sepenuhnya bertuliskan "Tidak Tersedia".
- Form tambah/edit armada menyediakan opsi "Tersedia" dan "Tidak Tersedia".
- Sistem logic, filtering ketersediaan, serta database mendukung nilai baru `"Tidak Tersedia"` dengan tetap kompatibel terhadap data riwayat/lama yang masih berstatus `"Dalam Perawatan"`.

---

## 2. Arsitektur & Komponen Terdampak

```
+-------------------------------------------------------------+
|                      Frontend (Vite/React)                  |
+-------------------------------------------------------------+
|  src/utils/constants.js                                      |
|    - VEHICLE_STATUS: { AVAILABLE, IN_USE, UNAVAILABLE }     |
|    - STATUS_COLORS: support 'Tidak Tersedia'                |
|                                                             |
|  src/components/ui/Badge.jsx                                |
|    - Normalisasi tampilan 'Dalam Perawatan' -> 'Tidak Tersedia'|
|                                                             |
|  Admin View:                                                |
|    - src/pages/admin/FleetPage.jsx                          |
|        * Table row status badge: 'Tidak Tersedia'           |
|        * Form Select options: 'Tersedia' / 'Tidak Tersedia' |
|    - src/components/dashboard/FleetCommandCenter.jsx        |
|        * Tooltip: '🔧 Tidak Tersedia'                       |
|        * Footer: '({count} tidak tersedia)'                 |
|    - src/components/dashboard/FleetTimetableBoard.jsx       |
|        * Track bar: 'Tidak Tersedia'                        |
|    - src/pages/admin/DashboardPage.jsx                      |
|        * Total resources filter                             |
|                                                             |
|  User View:                                                 |
|    - src/components/dashboard/VehicleShowcase.jsx           |
|    - src/components/dashboard/ResourceShowcase.jsx          |
|        * Showcase badge: 'Tidak Tersedia'                   |
|    - src/pages/user/DashboardPage.jsx                       |
|        * availableToday & calendar total resources          |
|    - src/contexts/BookingContext.jsx                        |
|        * getAvailableVehicles filter                        |
|    - src/components/shared/BookingModalFlow.jsx             |
|        * Exclude non-active vehicles from booking list      |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                     Backend (Node/Express/Drizzle)          |
+-------------------------------------------------------------+
|  server/src/utils/constants.ts                              |
|    - VEHICLE_STATUS.UNAVAILABLE = 'Tidak Tersedia'          |
|                                                             |
|  server/src/db/schema.ts                                    |
|    - enum: ['Tersedia', 'Tidak Tersedia', 'Dalam Perawatan']|
|                                                             |
|  server/src/services/vehicle.service.ts                     |
|    - getAllVehicles / getAvailableVehicles filter           |
+-------------------------------------------------------------+
```

---

## 3. Detail Perubahan Komponen

### 3.1. Frontend Constants & Badge
1. **`src/utils/constants.js`**:
   - `VEHICLE_STATUS`:
     ```javascript
     export const VEHICLE_STATUS = {
       AVAILABLE: 'Tersedia',
       IN_USE: 'Sedang Dipakai',
       UNAVAILABLE: 'Tidak Tersedia',
       MAINTENANCE: 'Tidak Tersedia', // Backward-compatibility alias
     };
     ```
   - `STATUS_COLORS`:
     ```javascript
     [VEHICLE_STATUS.UNAVAILABLE]: { bg: 'bg-warning-light dark:bg-warning/15', text: 'text-warning', dot: 'bg-warning' },
     'Dalam Perawatan': { bg: 'bg-warning-light dark:bg-warning/15', text: 'text-warning', dot: 'bg-warning' },
     ```
2. **`src/components/ui/Badge.jsx`**:
   - Berikan pemetaan label agar status kendaraan `'Dalam Perawatan'` ditampilkan sebagai `'Tidak Tersedia'`.

### 3.2. Sisi Admin
1. **`src/pages/admin/FleetPage.jsx`**:
   - Tabel menampilkan `<Badge status={v.status} />` yang secara visual menunjukkan label `"Tidak Tersedia"`.
   - Form modal Edit/Tambah kendaraan:
     - Dropdown status memiliki pilihan:
       ```jsx
       <option value="Tersedia">Tersedia</option>
       <option value="Tidak Tersedia">Tidak Tersedia</option>
       ```
     - Value matching: jika form status saat ini bernilai `'Dalam Perawatan'` atau `'Tidak Tersedia'`, dropdown otomatis mengikat nilai `"Tidak Tersedia"`.
2. **`src/components/dashboard/FleetCommandCenter.jsx`**:
   - Pengecekan kendaraan tidak aktif:
     ```javascript
     const isUnavailable = (v) => v.status === 'Tidak Tersedia' || v.status === 'Dalam Perawatan' || v.status === VEHICLE_STATUS.UNAVAILABLE;
     ```
   - Tooltip garasi: `🔧 Tidak Tersedia`.
   - Footer garasi: jika ada unit tidak aktif, tampilkan `({maintenanceCount} tidak tersedia)`.
3. **`src/components/dashboard/FleetTimetableBoard.jsx`**:
   - Pengecekan bar horizontal:
     ```javascript
     v.status === 'Tidak Tersedia' || v.status === 'Dalam Perawatan'
     ```
   - Teks bar timeline: `Tidak Tersedia`.
4. **`src/pages/admin/DashboardPage.jsx`**:
   - Hitungan `totalResources` kalender admin:
     ```javascript
     totalResources={vehicles.filter(v => v.status !== 'Tidak Tersedia' && v.status !== 'Dalam Perawatan').length}
     ```

### 3.3. Sisi User Biasa
1. **`src/components/dashboard/ResourceShowcase.jsx`**:
   - Helper label:
     ```javascript
     const getStatusLabel = (r) => {
       if (activeResourceIds.has(getResourceId(r))) return 'Dipakai';
       if (isMaintenance(r)) return 'Tidak Tersedia';
       return 'Tersedia';
     };
     ```
2. **`src/components/dashboard/VehicleShowcase.jsx`**:
   - `isMaintenance`:
     ```javascript
     isMaintenance: (v) => v.status === 'Tidak Tersedia' || v.status === 'Dalam Perawatan' || v.status === VEHICLE_STATUS.UNAVAILABLE,
     ```
3. **`src/pages/user/DashboardPage.jsx`**:
   - Hitungan kalender:
     ```javascript
     totalResources={vehicles.filter(v => v.status !== 'Tidak Tersedia' && v.status !== 'Dalam Perawatan').length}
     ```
4. **`src/contexts/BookingContext.jsx`**:
   - Filter `getAvailableVehicles`:
     ```javascript
     return vehicles.filter(
       (v) => v.status !== 'Tidak Tersedia' && v.status !== 'Dalam Perawatan' && !bookedVehicleIds.includes(v.id)
     );
     ```

### 3.4. Backend (`server/`)
1. **`server/src/utils/constants.ts`**:
   - Menambahkan:
     ```typescript
     export const VEHICLE_STATUS = {
       AVAILABLE: 'Tersedia',
       IN_USE: 'Sedang Dipakai',
       UNAVAILABLE: 'Tidak Tersedia',
       MAINTENANCE: 'Dalam Perawatan',
     } as const;
     ```
2. **`server/src/db/schema.ts`**:
   - Memperluas enum kolom status pada tabel `vehicle`:
     ```typescript
     status: text('status', { enum: ['Tersedia', 'Tidak Tersedia', 'Dalam Perawatan'] })
       .notNull()
       .default('Tersedia'),
     ```
3. **`server/src/services/vehicle.service.ts`**:
   - Pengecekan status tidak aktif pada `getAllVehicles` dan `getAvailableVehicles`:
     Mengecualikan kendaraan berstatus `'Tidak Tersedia'` maupun `'Dalam Perawatan'`.

---

## 4. Kriteria Pengujian & Verifikasi
1. **Verifikasi Admin**:
   - Buka halaman `/admin/fleet`: Baris mobil yang sebelumnya "Dalam Perawatan" kini memiliki badge kuning "Tidak Tersedia".
   - Klik "Edit" pada mobil: Dropdown Status menampilkan "Tidak Tersedia" dan "Tersedia". Saat disimpan dengan "Tidak Tersedia", data berhasil ter-update.
   - Buka `/admin/dashboard`: Tooltip garasi bertuliskan "Tidak Tersedia" dan bar timetable menampilkan "Tidak Tersedia".
2. **Verifikasi User Biasa**:
   - Buka `/user/dashboard`: Etalase kendaraan menampilkan tag status "Tidak Tersedia" untuk mobil terkait.
   - Klik "Buat Peminjaman" -> Pilih tanggal dan jam: Mobil yang berstatus "Tidak Tersedia" tidak muncul dalam daftar pilihan kendaraan yang bisa dipinjam.
3. **Integritas Modul Ruangan**:
   - Modul Ruangan (`/admin/room/*`, `/user/room/*`) tidak mengalami regresi dan status ruangan tetap berjalan normal.
