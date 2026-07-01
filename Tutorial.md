# 📖 Tutorial & Analisis Mendalam: BOOKOLAKA

Selamat datang di dokumentasi komprehensif **BOOKOLAKA**, Sistem Peminjaman Kendaraan Dinas, Ruang Rapat, dan Tracking Surat Perjalanan Dinas (SPD) untuk KPP Pratama Kolaka.

Dokumen ini berisi analisis mendalam terkait arsitektur sistem, alur fitur (flow), teknologi yang digunakan, serta panduan rinci mengenai fungsionalitas dan antarmuka untuk masing-masing peran (role) pengguna.

---

## 🌟 1. About (Tentang Proyek Ini)

**BOOKOLAKA** adalah sebuah aplikasi web modern (Single Page Application) terintegrasi yang dirancang khusus untuk memfasilitasi kebutuhan operasional internal KPP Pratama Kolaka. Sistem ini mendigitalisasi tiga proses utama:

1. **Kendaraan Dinas Operasional (KDO):** Mengelola peminjaman mobil/motor dinas lengkap dengan penugasan sopir.
2. **Ruang Rapat:** Memfasilitasi pemesanan ruang rapat dengan pengecekan jadwal secara *real-time* untuk menghindari bentrok (*overlapping*).
3. **Tracking SPD (Surat Perjalanan Dinas):** Memantau status perjalanan dinas pegawai dan jadwal WFO/WFH yang terintegrasi dengan data dari Google Sheets.

Sistem ini mendukung pengiriman notifikasi secara *real-time* dan fitur *chat* yang dienkripsi penuh antara pegawai dan administrator.

---

## 🏗️ 2. Arsitektur & Tech Stack

Aplikasi ini menggunakan stack teknologi terkini untuk menjamin kecepatan, keamanan, dan *scalability*:

*   **Frontend:** React 19, Vite 8, Tailwind CSS 3, Framer Motion (untuk animasi UI), React Router v7.
*   **Backend:** Express.js 5, TypeScript (ESM).
*   **Database:** PostgreSQL (NeonDB serverless) dikelola menggunakan Drizzle ORM.
*   **Authentication:** Better Auth (dengan plugin *username* untuk login menggunakan NIP) — menggunakan sistem berbasis *cookie* (HttpOnly, Secure).
*   **Real-time & Komunikasi:** Ably WebSockets (untuk sinkronisasi status dan *chat* *real-time*).
*   **Security:** AES-256-GCM (enkripsi pesan *chat*), Helmet, Rate Limiting.
*   **Integrasi Eksternal:** Google Sheets API (sumber data SPD).
*   **Deployment:** Vercel (sebagai *Serverless Functions* untuk backend dan static hosting untuk frontend).

---

## 🔄 3. Alur Kerja Utama (Feature Flow)

### A. Alur Peminjaman Kendaraan Dinas (KDO)
1.  **Request:** User mengajukan jadwal peminjaman kendaraan beserta detail tujuan dan penumpang. Status: `Pending`. Notifikasi terkirim ke Admin.
2.  **Approval:** Admin meninjau *request*.
    *   Jika disetujui: Admin memilih kendaraan dan (opsional) sopir yang tersedia. Status: `Disetujui`. Sistem otomatis akan menolak permintaan lain yang jadwal/kendaraannya bentrok.
    *   Jika ditolak: Admin memberikan alasan. Status: `Ditolak`.
3.  **Pelaksanaan:** Saat waktu peminjaman tiba, status otomatis dikomputasi menjadi `Sedang Dipakai`.
4.  **Selesai:** Setelah jadwal berakhir, status otomatis menjadi `Selesai`.
5.  **Review:** User dapat memberikan *review* kondisi kendaraan setelah dipakai (kebersihan, BBM, dsb). Status menjadi `Selesai dengan Catatan`.

### B. Alur Pemesanan Ruang Rapat
1.  **Request:** User memilih ruang rapat yang tersedia pada jam tertentu. Sistem menerapkan *First-Come-First-Serve*.
2.  **Auto-Approve:** Tidak perlu persetujuan admin. Jika jadwal tidak bentrok, status langsung `Disetujui`.
3.  **Pembatalan:** Baik User maupun Admin dapat membatalkan jadwal (Admin wajib menyertakan alasan pembatalan).

### C. Alur Tracking SPD & Jadwal Jumat
1.  **Sumber Data:** Data bersumber secara *read-only* dari sistem Google Sheets kantor.
2.  **Monitoring:** Admin dan User memantau status SPD (`Belum Berangkat`, `Sedang Berjalan`, `Selesai`).
3.  **Caching:** Backend menggunakan Upstash Redis untuk melakukan *caching* data Sheets guna mencegah limitasi API Google.

---

## 👥 4. Tampilan & Panduan Berdasarkan Role (Peran)

Sistem membagi akses menjadi 3 peran: **User**, **Admin**, dan **Superadmin**.

### 🔓 Login & Service Selector (Semua Role)
*   **Login Page (`/login`):** Menggunakan NIP (sebagai *username*) dan Password. Memiliki fitur *show/hide* password dan tombol *toggle* tema (Dark/Light). Terdapat proteksi *lockout* (akun terkunci 5 menit jika gagal login 5 kali berturut-turut).
*   **Service Selector (`/select-service`):** Setelah login, User dan Admin akan melihat layar *hub* berisi 3 kartu layanan besar: **KDO**, **Ruang Rapat**, dan **Tracking SPD**. Kartu akan berwarna abu-abu jika Superadmin menonaktifkan (*maintenance*) layanan tersebut. Superadmin otomatis melompati halaman ini.

---

### 👑 1. Role: SUPERADMIN
Superadmin adalah peran absolut pemegang kendali sistem. Mampu melewati semua pemeriksaan (*bypass*) mode perbaikan (*maintenance mode*).

*   **Akses Layar:** Menggunakan navigasi *sidebar* di sebelah kiri.
*   **Halaman Dashboard (`/superadmin/dashboard`):**
    *   Menampilkan *overview* total pengguna, admin, layanan aktif, dan total antrean.
    *   **Fitur Spesial:** "System Reset Control". Terdapat 5 tombol reset ekstrem (Booking, Driver, Vehicle, Room, Room Booking) yang membutuhkan validasi *password* superadmin untuk mencegah ketidaksengajaan.
*   **Account Management (`/superadmin/accounts`):**
    *   Tabel *paginated* seluruh akun.
    *   Mampu membuat pengguna baru, mereset password ke bawaan ("Kolaka2026!"), hingga mengubah peran pengguna biasa menjadi Admin atau sebaliknya.
*   **Service Control (`/superadmin/service`):**
    *   Terdapat 3 tombol saklar utama (*toggle switch*) untuk KDO, Ruang Rapat, dan Tracking SPD.
    *   Bila dimatikan, seluruh pengguna biasa dan admin yang mencoba mengakses layanan tersebut akan diarahkan ke halaman "Maintenance/Perbaikan".
*   **Activity Log (`/superadmin/logs`):**
    *   Jejak rekam audit sistem secara kronologis (siapa login, siapa memesan, siapa mengubah data, berserta alamat IP). Fitur ekspor ke Excel juga tersedia di sini.

---

### 🛡️ 2. Role: ADMIN
Admin bertanggung jawab penuh atas operasional modul layanan (Kendaraan, Ruang Rapat, Data SPD).

#### Admin Modul KDO (Kendaraan Dinas)
*   **Dashboard (`/admin/dashboard`):** Menampilkan *Command Center* dengan status kendaraan *real-time*, *Gantt Chart* peminjaman, serta kalender untuk melakukan pemesanan paksa (*Mandatory Booking*) yang otomatis berstatus disetujui.
*   **Request Board (`/admin/requests`):** Layar ala papan *Kanban* atau tabel untuk melihat permintaan. Di sini Admin memproses (Menyetujui/Menolak) pesanan peminjaman. Admin wajib mengalokasikan mobil & sopir saat menyetujui.
*   **Manajemen Armada & Sopir (`/admin/fleet` & `/admin/drivers`):** Layar untuk menambahkan (termasuk unggah foto), mengedit, menghapus, atau mengatur status ketersediaan armada dan pengemudi.
*   **Laporan (`/admin/reports`):** Admin dapat menyaring rentang tanggal, melihat grafik pemakaian, dan mengekspor seluruh data log ke format `.xlsx` (Excel).
*   **Admin Chat (`/admin/chat`):** Layar dengan *split-pane* (panel ganda). Panel kiri menampilkan daftar pegawai yang menge-chat, panel kanan jendela *chat real-time*. Admin dapat memberikan balasan langsung ke *user*.

#### Admin Modul Ruang Rapat
*   **Manajemen Ruang (`/admin/room/rooms`):** Layar untuk membuat profil ruang rapat baru (lengkap dengan foto, kapasitas, dan fasilitas).
*   **Request Board (`/admin/room/requests`):** Admin bertugas memantau pergerakan jadwal rapat, dan memiliki hak veto untuk membatalkan pesanan (dengan kewajiban mengisi alasan pembatalan).

#### Admin Modul Tracking SPD
*   **Monitoring & Perjadin (`/admin/tracking/...`):** Mengawasi Surat Tugas yang masuk dari integrasi Google Sheets. Admin dapat melihat wilayah tugas berdasarkan warna (Kolaka=Hijau, Kendari=Pink, dsb). Admin juga memiliki akses menekan tombol *refresh* cache secara paksa.
*   **Jadwal Jumat (`/admin/tracking/jadwal-jumat`):** Mengatur siapa yang WFO/WFH pada hari jumat yang ditentukan, sistem akan membantu menyarankan secara otomatis putaran staf.

---

### 🧑‍💻 3. Role: USER (Pengguna Biasa / Pegawai)
User berhak untuk memakai sistem sesuai dengan tugas dan kebutuhannya. Antarmuka lebih sederhana dan minimalis, menggunakan *bottom navigation bar* pada layar peramban HP.

#### User Modul KDO (Kendaraan Dinas)
*   **Dashboard (`/user/dashboard`):** Menampilkan status ringkas (Disetujui/Pending/Ditolak), tombol pintasan "Pesan Kendaraan", dan daftar kendaraan yang siap pakai.
*   **My Bookings (`/user/my-bookings`):** Daftar peminjaman milik sendiri yang dapat difilter (Disetujui, Berjalan, Selesai). Di sini User bisa membatalkan pesanan (jika masih *Pending*), atau menulis *Review* jika mobil selesai dipakai.
*   **Chat (`/user/chat`):** Penghubung komunikasi langsung dari User ke Admin (misal: "Pak, mobil X kuncinya di mana?").
*   **Account (`/user/account`):** Pengaturan *Theme* (Gelap/Terang), pengaturan Notifikasi, serta ubah kata sandi.

#### User Modul Ruang Rapat
*   Fungsi mirip KDO, namun pada layar **Dashboard** dan **My Room Bookings**, pendaftaran langsung otomatis *Approved* selama tidak tumpang tindih dengan jam rapat lain. User tidak perlu *chat* dengan admin untuk peminjaman ruangan.

#### User Modul Tracking SPD
*   **Dashboard & SPD Saya:** User hanya dapat melihat rekam jejak Surat Perjalanan Dinas dan Agenda Surat Tugas (ST) **milik dirinya sendiri**. Sistem otomatis memfilter data dari Google Sheets berdasarkan nama User.

---

## 🔒 5. Keamanan Ekstra & Fitur Real-time Tersembunyi

Sistem ini tidak hanya bagus dari sisi UI, tetapi memiliki perlindungan lapisan dalam (backend):

1.  **AES-256-GCM Encrypted Chat:** Setiap pesan teks dalam aplikasi antara admin dan user dienkripsi *end-to-end* menuju database. Jika database bocor, pesan tetap aman terbaca acak.
2.  **IDOR Protection:** Pengecekan ID ketat, sehingga User A tidak mungkin melihat detail pemesanan milik User B melalui eksploitasi API.
3.  **Session & Lockout:** Pengguna yang gagal menebak password 5 kali dikunci 5 menit. Akses menggunakan sistem API Cookie yang tahan serangan XSS, dilengkapi rotasi sesi harian.
4.  **Pub/Sub Ably Socket:** Semua pembaruan di Request Board admin terjadi tanpa *reload* halaman karena soket `Ably` mendistribusikan notifikasi di belakang layar.

---

**Selesai!** Demikian dokumentasi *Tutorial & Analisis Mendalam BOOKOLAKA*. Sistem telah dirancang agar terorganisir dengan rapi, skalabel, serta mengutamakan alur komunikasi yang jelas antar-pegawai (User) dan pengelola (Admin/Superadmin).
