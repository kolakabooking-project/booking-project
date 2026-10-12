# Perubahan Status Kendaraan: "Dalam Perawatan" -> "Tidak Tersedia" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah kata status kendaraan dari "Dalam Perawatan" menjadi "Tidak Tersedia" pada modul booking mobil, menangani tampilan baik untuk role Admin maupun User Biasa, dengan kompatibilitas penuh terhadap data lama di database.

**Architecture:** Menerapkan pendekatan Dual-Compatible: konstanta dan UI menyajikan "Tidak Tersedia", sementara logic pemfilteran dan validasi schema mendukung baik "Tidak Tersedia" maupun nilai lama "Dalam Perawatan" agar data existing tetap berfungsi tanpa merusak sistem.

**Tech Stack:** React 19, Vite, Tailwind CSS, Node.js, Express, Drizzle ORM, TypeScript.

---

### Task 1: Backend Constants, Schema, dan Vehicle Service

**Files:**
- Modify: `server/src/utils/constants.ts:12-18`
- Modify: `server/src/db/schema.ts:81-85`
- Modify: `server/src/services/vehicle.service.ts:49-55, 101-106`

- [ ] **Step 1: Update konstanta status kendaraan di server**
Perbarui `server/src/utils/constants.ts` agar menyertakan `UNAVAILABLE: 'Tidak Tersedia'` dan mempertahankan alias `MAINTENANCE`:
```typescript
// ─── Vehicle Status ───
export const VEHICLE_STATUS = {
  AVAILABLE: 'Tersedia',
  IN_USE: 'Sedang Dipakai',
  UNAVAILABLE: 'Tidak Tersedia',
  MAINTENANCE: 'Tidak Tersedia',
} as const;

export const LEGACY_MAINTENANCE_STATUS = 'Dalam Perawatan' as const;
```

- [ ] **Step 2: Update enum schema kendaraan di Drizzle**
Perbarui `server/src/db/schema.ts` pada definisi tabel `vehicle` agar kolom `status` menerima `'Tidak Tersedia'` selain `'Tersedia'` dan `'Dalam Perawatan'`:
```typescript
  status: text('status', { enum: ['Tersedia', 'Tidak Tersedia', 'Dalam Perawatan'] })
    .notNull()
    .default('Tersedia'),
```

- [ ] **Step 3: Update filter query pada vehicle.service.ts**
Perbarui `server/src/services/vehicle.service.ts`:
1. Pada `getAllVehicles`: jika `vehicleData.status === 'Tidak Tersedia' || vehicleData.status === 'Dalam Perawatan'`, return `vehicleData`.
2. Pada `getAvailableVehicles`: filter `not(inArray(vehicle.status, ['Tidak Tersedia', 'Dalam Perawatan']))`.

- [ ] **Step 4: Build backend untuk memastikan TypeScript valid**
Run: `npm --prefix server run build`
Expected: Berhasil dikompilasi tanpa error TypeScript (`dist` ter-generate).

- [ ] **Step 5: Commit perubahan backend**
```bash
git add server/src/utils/constants.ts server/src/db/schema.ts server/src/services/vehicle.service.ts
git commit -m "feat(server): support 'Tidak Tersedia' vehicle status with dual compatibility"
```

---

### Task 2: Frontend Constants, Badge Component, dan Booking Context

**Files:**
- Modify: `src/utils/constants.js:29-33, 63-66`
- Modify: `src/components/ui/Badge.jsx:3-19`
- Modify: `src/contexts/BookingContext.jsx:298-304`

- [ ] **Step 1: Update konstanta status dan warna badge di frontend**
Di `src/utils/constants.js`:
```javascript
export const VEHICLE_STATUS = {
  AVAILABLE: 'Tersedia',
  IN_USE: 'Sedang Dipakai',
  UNAVAILABLE: 'Tidak Tersedia',
  MAINTENANCE: 'Tidak Tersedia',
};
```
Dan pada `STATUS_COLORS`:
```javascript
  [VEHICLE_STATUS.AVAILABLE]: { bg: 'bg-success-light dark:bg-success/15', text: 'text-success', dot: 'bg-success' },
  [VEHICLE_STATUS.IN_USE]: { bg: 'bg-info-light dark:bg-info/15', text: 'text-info', dot: 'bg-info' },
  [VEHICLE_STATUS.UNAVAILABLE]: { bg: 'bg-warning-light dark:bg-warning/15', text: 'text-warning', dot: 'bg-warning' },
  'Dalam Perawatan': { bg: 'bg-warning-light dark:bg-warning/15', text: 'text-warning', dot: 'bg-warning' },
```

- [ ] **Step 2: Normalisasi tampilan status pada Badge.jsx**
Di `src/components/ui/Badge.jsx`:
Jika `status === 'Dalam Perawatan'`, tampilkan label `'Tidak Tersedia'`:
```javascript
export default function Badge({ status, className = '' }) {
  const displayStatus = status === 'Dalam Perawatan' ? 'Tidak Tersedia' : status;
  const colors = STATUS_COLORS[displayStatus] || STATUS_COLORS[status] || { bg: 'bg-slate-500/10', text: 'text-slate-500 dark:text-slate-300', dot: 'bg-slate-400' };
  const isPending = displayStatus === 'Pending';

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-heading
        ${colors.bg} ${colors.text} ${className}
      `}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${colors.dot} ${isPending ? 'animate-pulse-slow' : ''}`}
      />
      {displayStatus}
    </span>
  );
}
```

- [ ] **Step 3: Update filter getAvailableVehicles di BookingContext.jsx**
Di `src/contexts/BookingContext.jsx` pada `getAvailableVehicles`:
```javascript
      return vehicles.filter(
        (v) => v.status !== 'Tidak Tersedia' && v.status !== 'Dalam Perawatan' && !bookedVehicleIds.includes(v.id)
      );
```

- [ ] **Step 4: Commit perubahan Task 2**
```bash
git add src/utils/constants.js src/components/ui/Badge.jsx src/contexts/BookingContext.jsx
git commit -m "feat(frontend): add 'Tidak Tersedia' status mapping and badge normalization"
```

---

### Task 3: Tampilan Admin (FleetPage, FleetCommandCenter, FleetTimetableBoard, Dashboard)

**Files:**
- Modify: `src/pages/admin/FleetPage.jsx:93-96`
- Modify: `src/components/dashboard/FleetCommandCenter.jsx:30-34, 160-162, 222-225, 230-235`
- Modify: `src/components/dashboard/FleetTimetableBoard.jsx:262-268`
- Modify: `src/pages/admin/DashboardPage.jsx:55-58`

- [ ] **Step 1: Update form modal di FleetPage.jsx**
Perbarui dropdown status modal di `src/pages/admin/FleetPage.jsx`:
```jsx
          <FormInput 
            label="Status" 
            id="status" 
            type="select" 
            value={form.status === VEHICLE_STATUS.IN_USE ? VEHICLE_STATUS.AVAILABLE : (form.status === 'Dalam Perawatan' ? 'Tidak Tersedia' : form.status)} 
            onChange={(e) => handleFormChange('status', e.target.value)}
          >
            <option value="Tersedia">Tersedia</option>
            <option value="Tidak Tersedia">Tidak Tersedia</option>
          </FormInput>
```

- [ ] **Step 2: Update FleetCommandCenter.jsx**
1. Pada `VehicleSlot`:
   ```jsx
   {variant === 'maintenance' && <div className="fcc-tooltip-sub" style={{ color: '#f59e0b' }}>🔧 Tidak Tersedia</div>}
   ```
2. Pada counter:
   ```javascript
   const isVehicleUnavailable = (v) => v.status === 'Tidak Tersedia' || v.status === 'Dalam Perawatan';
   const availableCount = garageVehicles.filter((v) => !isVehicleUnavailable(v)).length;
   const maintenanceCount = garageVehicles.filter(isVehicleUnavailable).length;
   ```
3. Pada slot mapping di Garasi:
   ```jsx
   variant={isVehicleUnavailable(v) ? 'maintenance' : 'available'}
   ```
4. Pada footer:
   ```jsx
   {maintenanceCount > 0 && <span style={{ fontSize: '0.625rem', opacity: 0.6, marginLeft: '0.25rem' }}>({maintenanceCount} tidak tersedia)</span>}
   ```

- [ ] **Step 3: Update FleetTimetableBoard.jsx**
Ubah pengecekan dan bar text:
```jsx
{v.status === 'Tidak Tersedia' || v.status === 'Dalam Perawatan' ? (
  <div className="ftb-maintenance-bar">
    <Wrench size={12} style={{ marginRight: '6px' }} />
    Tidak Tersedia
  </div>
) :
```

- [ ] **Step 4: Update totalResources di admin DashboardPage.jsx**
```jsx
totalResources={vehicles.filter(v => v.status !== 'Tidak Tersedia' && v.status !== 'Dalam Perawatan').length}
```

- [ ] **Step 5: Commit perubahan Task 3**
```bash
git add src/pages/admin/FleetPage.jsx src/components/dashboard/FleetCommandCenter.jsx src/components/dashboard/FleetTimetableBoard.jsx src/pages/admin/DashboardPage.jsx
git commit -m "feat(admin): display 'Tidak Tersedia' in fleet management and command center"
```

---

### Task 4: Tampilan User Biasa (ResourceShowcase, VehicleShowcase, User DashboardPage)

**Files:**
- Modify: `src/components/dashboard/ResourceShowcase.jsx:95-100`
- Modify: `src/components/dashboard/VehicleShowcase.jsx:24`
- Modify: `src/pages/user/DashboardPage.jsx:21-24, 85-90`

- [ ] **Step 1: Update ResourceShowcase.jsx**
Ubah `getStatusLabel`:
```javascript
  const getStatusLabel = (r) => {
    if (activeResourceIds.has(getResourceId(r))) return 'Dipakai';
    if (isMaintenance(r)) return 'Tidak Tersedia';
    return 'Tersedia';
  };
```

- [ ] **Step 2: Update VehicleShowcase.jsx**
Ubah `isMaintenance` agar mendeteksi `'Tidak Tersedia'` maupun `'Dalam Perawatan'`:
```javascript
isMaintenance: (v) => v.status === 'Tidak Tersedia' || v.status === 'Dalam Perawatan',
```

- [ ] **Step 3: Update user DashboardPage.jsx**
Perbarui `availableToday` dan `totalResources` kalender:
```javascript
const availableToday = vehicles.filter((v) => v.status === 'Tersedia').length;
```
Dan pada `<Calendar>`:
```jsx
totalResources={vehicles.filter(v => v.status !== 'Tidak Tersedia' && v.status !== 'Dalam Perawatan').length}
```

- [ ] **Step 4: Commit perubahan Task 4**
```bash
git add src/components/dashboard/ResourceShowcase.jsx src/components/dashboard/VehicleShowcase.jsx src/pages/user/DashboardPage.jsx
git commit -m "feat(user): display 'Tidak Tersedia' on showcase and user dashboard"
```

---

### Task 5: Build dan Verifikasi Menyeluruh

**Files:**
- All modified files

- [ ] **Step 1: Jalankan build Vite frontend**
Run: `npm run build`
Expected: Build sukses tanpa error atau peringatan impor/sintaks.

- [ ] **Step 2: Jalankan build TypeScript backend**
Run: `npm --prefix server run build`
Expected: Build server sukses tanpa error compiler.

- [ ] **Step 3: Verifikasi grep untuk memastikan tidak ada sisa teks tidak sengaja**
Run: `grep -rn --exclude-dir={node_modules,.next,.git,dist} "Dalam Perawatan" src/`
Expected: Hanya muncul sebagai fallback mapping/kompatibilitas yang disengaja.

- [ ] **Step 4: Commit dan Finalisasi**
```bash
git commit -m "chore: complete verification for 'Tidak Tersedia' status transition" --allow-empty
```
