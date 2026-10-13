# 🚗 BOOKOLAKA — Portal Operasional Terpadu KPP Pratama Kolaka

[![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-purple.svg?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5-green.svg?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-NeonDB-blue.svg?logo=postgresql)](https://neon.tech/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Internal_KPP_Kolaka-djp.svg)](#lisensi)

**BOOKOLAKA** adalah platform web modern internal **Kantor Pelayanan Pajak (KPP) Pratama Kolaka** untuk mengelola seluruh operasional kedinasan secara terintegrasi, real-time, dan terstandarisasi. 

Aplikasi ini mencakup modul **Peminjaman Kendaraan Dinas (KDO)**, **Peminjaman Ruang Rapat**, **Monitoring Surat Perjalanan Dinas (SPD) & Cuti Pegawai**, serta **Manajemen Agenda Pimpinan (Kepala Kantor & Sekretaris)**.

---

## 📑 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Matriks Hak Akses (RBAC)](#-matriks-hak-akses-rbac)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Struktur Folder](#-struktur-folder)
- [Panduan Instalasi & Pengembangan](#-panduan-instalasi--pengembangan)
- [Konfigurasi Environment Variables](#-konfigurasi-environment-variables)
- [Arsitektur Keamanan](#-arsitektur-keamanan)
- [Lisensi](#-lisensi)

---

## 🌟 Fitur Utama

### 1. 🚗 Manajemen Kendaraan Dinas Operasional (KDO)
* **Status Kendaraan Terstandarisasi**: Menggunakan status visual dan logis yang jelas:
  * **Tersedia**: Siap digunakan untuk operasional.
  * **Tidak Tersedia**: Kendaraan dinas sedang dalam masa perawatan, servis, atau non-aktif operasional.
  * **Sedang Dipakai**: Status dinamis *real-time* saat kendaraan sedang dalam perjalanan dinas aktif.
* **Interactive Fleet Command Center**: Visualisasi denah Garasi Kolaka interaktif yang menampilkan posisi kendaraan di garasi, unit bertugas, pengajuan menunggu review, dan unit tidak tersedia.
* **Fleet Timetable Board**: Visualisasi Gantt chart horizontal untuk memantau jadwal armada per tanggal dengan indikator pemeliharaan dan slot peminjaman.
* **Smart Booking Flow**: Alur peminjaman pintar (harian maupun multi-hari) yang otomatis menyaring kendaraan yang tersedia tanpa konflik jadwal, dengan dukungan permohonan sopir dinas.
* **Inventaris & Perawatan Armada**: Pengelolaan data kendaraan lengkap (Plat Nomor, Merek, Tahun, Kapasitas, Foto, Odometer, serta pengingat Jadwal Pajak dan Jadwal Servis Rutin).
* **Manajemen Pengemudi (Sopir)**: Pemantauan ketersediaan pengemudi, status tugas harian, dan masa berlaku SIM.

### 2. 🏢 Manajemen Ruang Rapat (Room Booking)
* **Etalase & Kalender Ruangan**: Tampilan interaktif jadwal ketersediaan ruang rapat per hari.
* **Alur Pengajuan & Persetujuan**: Pengajuan peminjaman ruang rapat oleh pegawai dengan alur approval admin ruangan.
* **Manajemen Ruang Rapat**: Pengaturan detail ruangan, kapasitas kursi, foto, dan status ruangan.
* **Laporan Penggunaan Ruangan**: Riwayat dan rekapitulasi rapat kedinasan.

### 3. 📊 Monitoring SPD & Kehadiran Pegawai (Sheets Integration)
* **Sinkronisasi Google Sheets API v4**: Integrasi langsung dengan spreadsheet monitoring kegiatan luar kantor dan Surat Perjalanan Dinas (SPD).
* **High-Performance Caching**: Menggunakan Upstash Redis dan memory caching untuk akses data cepat dan efisiensi kuota API.
* **Widget Beranda Real-Time**:
  * *Sedang Dinas Hari Ini*: Daftar pegawai yang sedang menjalankan tugas luar kantor (ST/SPD aktif).
  * *Sedang Cuti Hari Ini*: Daftar pegawai yang sedang menjalani masa cuti.
  * *Jadwal WFO/WFH Hari Jumat*: Monitoring kepatuhan jadwal kehadiran mingguan.
* **Rekapitulasi SPD**: Pemantauan dokumen SPD dan laporan kegiatan per seksi.

### 4. 📅 Agenda Pimpinan (Kepala Kantor & Sekretaris)
* **Kalender Khusus Pimpinan**: Manajemen kegiatan kedinasan Kepala Kantor dengan visualisasi kalender agenda.
* **Manajemen Kegiatan & Surat Tugas (ST)**: Sekretaris dapat mengelola agenda masuk, disposisi kegiatan, serta pengarsipan nomor Surat Tugas.

### 5. 🛡️ Superadmin & Kontrol Layanan
* **Service Control (Kill-Switch)**: Sakelar mandiri untuk mengaktifkan mode pemeliharaan (*maintenance mode*) secara independen per modul (Layanan KDO, Layanan Ruang Rapat, atau Layanan Tracking SPD).
* **Manajemen Akun & Pengguna**: Pengelolaan kredensial pegawai (NIP, Role, Reset Password, Akun Nonaktif).
* **Audit Trail & Activity Logs**: Pencatatan aktivitas sistem lengkap (siapa melakukan apa, kapan, dan dari IP mana).
* **Broadcast Pengumuman**: Fitur pembuatan pesan pengumuman (*Announcement*) yang otomatis muncul saat pegawai login.

### 6. ⚡ Pengalaman Pengguna & Realtime
* **Realtime Sync**: Didukung Ably WebSockets untuk pembaruan status booking, status garasi, dan chat seketika tanpa perlu me-refresh halaman.
* **Web Push Notifications (VAPID)**: Notifikasi desktop & mobile instan untuk persetujuan permohonan.
* **End-to-End Encrypted Live Chat**: Komunikasi instan admin dan pegawai dengan enkripsi AES-256-GCM.
* **Progressive Web App (PWA)**: Dukungan instalasi aplikasi di desktop dan perangkat mobile.
* **Mode Tampilan**: Dukungan penuh Dark Mode dan Light Mode yang responsif.
* **Ekspor Data**: Dukungan ekspor laporan ke format spreadsheet Microsoft Excel (`.xlsx`).

---

## 👥 Matriks Hak Akses (RBAC)

| Modul / Fitur | Pegawai (User) | Admin KDO | Admin Ruangan | Kepala Kantor | Sekretaris | Superadmin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Booking KDO** | Buat & Pantau | Buat & Setujui | - | Pantau Eksekutif | - | Kontrol Penuh |
| **Manajemen Armada & Sopir** | - | Kelola Penuh | - | Pantau | - | Kontrol Penuh |
| **Booking Ruang Rapat** | Buat & Pantau | - | Buat & Setujui | Pantau | - | Kontrol Penuh |
| **Monitoring SPD & Kehadiran** | Lihat Pribadi | Lihat Semua | Lihat Semua | Pantau Eksekutif | Pantau | Kontrol Penuh |
| **Agenda & Surat Tugas** | - | - | - | Kalender Agenda | Kelola Agenda & ST | Kontrol Penuh |
| **Kontrol Layanan & User** | - | - | - | - | - | Kelola Penuh |

---

## 🛠️ Tech Stack

### Frontend
* **Core**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/) + [React Router 7](https://reactrouter.com/)
* **State & Data Fetching**: [TanStack React Query v5](https://tanstack.com/query/latest)
* **Styling**: [TailwindCSS v3](https://tailwindcss.com/) + CSS Variables
* **Animasi & Interaktivitas**: [Framer Motion v12](https://www.framer.com/motion/) + [Lucide Icons](https://lucide.dev/)
* **Notifikasi UI**: [Sonner](https://sonner.emilkowal.ski/)
* **Ekspor Laporan**: [SheetJS (xlsx)](https://sheetjs.com/) + [FileSaver](https://github.com/eligrey/FileSaver.js)

### Backend
* **Runtime & Framework**: [Node.js](https://nodejs.org/) + [Express.js v5](https://expressjs.com/) + [TypeScript](https://www.typescriptlang.org/)
* **ORM & Database**: [Drizzle ORM](https://orm.drizzle.team/) + [PostgreSQL](https://www.postgresql.org/) ([Neon Serverless](https://neon.tech/))
* **Autentikasi**: [Better Auth](https://www.better-auth.com/) (Cookie-based Sessions HttpOnly)
* **Realtime Engine**: [Ably Realtime WebSockets](https://ably.com/)
* **Integrasi Eksternal**: Google Sheets API v4 ([googleapis](https://github.com/googleapis/google-api-nodejs-client))
* **Cache Layer**: [Upstash Redis](https://upstash.com/)
* **Push Notifications**: [web-push](https://github.com/web-push-libs/web-push) (VAPID Standard)
* **Keamanan**: Helmet, Express Rate Limit, Zod Validation, Crypto (AES-256-GCM)

---

## 📁 Struktur Folder

```
booking-project/
├── api/                     # Serverless handler entry point (Vercel)
│   └── index.ts
├── public/                  # Static assets, icons, manifest PWA
├── src/                     # Source code React Frontend
│   ├── components/          # Reusable UI, dashboard widgets, layouts, modal flow
│   │   ├── dashboard/       # FleetCommandCenter, Timetable, Showcase, Widgets
│   │   ├── layout/          # AdminLayout, UserLayout, SuperadminLayout, dll.
│   │   ├── shared/          # BookingModalFlow, Calendar, NotificationBell
│   │   └── ui/              # Button, Modal, Badge, DataTable, FormInput, dll.
│   ├── contexts/            # React Contexts (Auth, Booking, Room, Theme, Ably)
│   ├── hooks/               # Custom hooks (useFleetManagement, useSheetData, dll.)
│   ├── lib/                 # API client wrapper, Ably config
│   ├── pages/               # Halaman antarmuka (User, Admin, Room, Tracking, Superadmin)
│   └── utils/               # Konstanta (VEHICLE_STATUS, ROLES), date helpers
├── server/                  # Source code Express Backend
│   ├── src/
│   │   ├── auth/            # Konfigurasi Better Auth
│   │   ├── config/          # Database, Environment Zod schema
│   │   ├── db/              # Schema Drizzle, migrasi, seeder data
│   │   ├── middleware/      # AuthGuard, RoleGuard, MaintenanceGuard
│   │   ├── routes/          # REST endpoints (vehicle, booking, room, sheets, dll.)
│   │   ├── services/        # Business logic & query database
│   │   └── utils/           # Enkripsi chat, constants backend, error handler
│   ├── drizzle/             # File migrasi database SQL Drizzle
│   └── uploads/             # Direktori penyimpanan media lokal (foto kendaraan/ruangan)
├── vercel.json              # Konfigurasi deployment Vercel
└── README.md                # Dokumentasi proyek
```

---

## 🚀 Panduan Instalasi & Pengembangan

### Prasyarat Sistem
* **Node.js**: Versi `18.x` atau lebih baru
* **Package Manager**: `npm` (atau `pnpm` / `yarn`)
* **Database**: PostgreSQL (Lokal atau Neon Cloud Database)

### 1. Kloning Repositori
```bash
git clone https://github.com/kolakabooking-project/booking-project.git
cd booking-project
```

### 2. Instalasi Dependensi
```bash
# Instal dependensi frontend (root)
npm install

# Instal dependensi backend (server)
cd server && npm install && cd ..
```

### 3. Konfigurasi Variabel Lingkungan
Salin file template environment di direktori server:
```bash
cp server/.env.example server/.env
```
Sesuaikan nilai `DATABASE_URL`, `BETTER_AUTH_SECRET`, dan konfigurasi lainnya pada `server/.env`.

### 4. Setup Database & Migrasi
Jalankan migrasi skema tabel Drizzle ke PostgreSQL:
```bash
cd server
npm run db:push

# (Opsional) Jalankan seed data pegawai awal
npm run db:seed
cd ..
```

### 5. Menjalankan Server Pengembangan

Buka dua tab terminal terpisah:

**Terminal 1 — Backend API Server:**
```bash
cd server
npm run dev
# Server berjalan di: http://localhost:3001
```

**Terminal 2 — Frontend Client:**
```bash
npm run dev
# Frontend berjalan di: http://localhost:5173
```

---

## ⚙️ Konfigurasi Environment Variables

File `server/.env` membutuhkan konfigurasi berikut:

```env
# ─── Database PostgreSQL ───
DATABASE_URL=postgresql://user:password@localhost:5432/bookolaka
NODE_ENV=development
PORT=3001

# ─── CORS Origins (pisahkan dengan koma jika banyak) ───
CORS_ORIGINS=http://localhost:5173

# ─── Better Auth Session ───
BETTER_AUTH_SECRET=rahasia-minimal-32-karakter-acak-untuk-keamanan-session
BETTER_AUTH_URL=http://localhost:3001

# ─── Realtime Ably ───
ABLY_API_KEY=your_ably_api_key

# ─── Enkripsi Chat (AES-256-GCM: 64 karakter heksadesimal) ───
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# ─── Web Push (VAPID) ───
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:admin@kpp-kolaka.internal

# ─── Google Sheets API (Monitoring SPD) ───
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SHEETS_CACHE_TTL=300

# ─── Upstash Redis Cache (Opsional / Recommended) ───
UPSTASH_REDIS_REST_URL=https://your-upstash-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

---

## 🔒 Arsitektur Keamanan

Sistem BOOKOLAKA menerapkan prinsip keamanan berlapis untuk lingkungan instansi pemerintah:
* **Session Keamanan Tinggi**: Autentikasi berbasis *cookie* dengan atribut `HttpOnly`, `Secure`, dan `SameSite=Strict/Lax` guna mencegah serangan XSS dan pencurian token.
* **Proteksi Headers**: Dikelola dengan [Helmet](https://helmetjs.github.io/) dengan konfigurasi ketat Content Security Policy (CSP), anti-clickjacking, dan HSTS preload.
* **Rate Limiting**: Pembatasan laju permintaan untuk mencegah brute force pada endpoint login (20 request / 15 menit) dan rate limit API umum (300 request / 15 menit).
* **Enkripsi End-to-End Pesan**: Pesan live chat dienkripsi pada tingkat basis data menggunakan algoritma **AES-256-GCM**.
* **Proteksi SQL Injection**: Seluruh transaksi basis data menggunakan parameterized queries melalui Drizzle ORM.
* **Validasi Skema Berlapis**: Validasi ketat pada setiap payload input menggunakan **Zod**.

---

## 📄 Lisensi

Hak Cipta © **KPP Pratama Kolaka**.  
Seluruh hak cipta dilindungi undang-undang. Sistem ini dikembangkan untuk kebutuhan operasional internal Direktorat Jenderal Pajak / KPP Pratama Kolaka.
