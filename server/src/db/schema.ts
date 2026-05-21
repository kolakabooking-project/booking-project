import { pgTable, text, integer, boolean, timestamp, date, index } from 'drizzle-orm/pg-core';

// ─────────────────────────────────────────────
//  Better Auth Core Tables
// ─────────────────────────────────────────────

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),

  // ── Custom fields ──
  nip: text('nip').notNull().unique(),
  role: text('role', { enum: ['user', 'admin', 'superadmin'] }).notNull().default('user'),
  jabatan: text('jabatan'),
  username: text('username').unique(),
  displayUsername: text('display_username'),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockoutUntil: timestamp('lockout_until'),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

// ─────────────────────────────────────────────
//  Application Domain Tables
// ─────────────────────────────────────────────

export const vehicle = pgTable('vehicle', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  platNomor: text('plat_nomor').notNull().unique(),
  merek: text('merek').notNull(),
  tipe: text('tipe', { enum: ['Mobil', 'Motor'] }).notNull().default('Mobil'),
  tahun: integer('tahun').notNull(),
  kapasitas: integer('kapasitas').notNull().default(7),
  status: text('status', { enum: ['Tersedia', 'Dalam Perawatan'] })
    .notNull()
    .default('Tersedia'),
  odometer: integer('odometer').notNull().default(0),
  jadwalPajak: date('jadwal_pajak'),
  jadwalServis: date('jadwal_servis'),
  warna: text('warna'),
  foto: text('foto'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('vehicle_deleted_idx').on(table.deletedAt),
]);

export const driver = pgTable('driver', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  noHP: text('no_hp'),
  status: text('status', { enum: ['Tersedia', 'Bertugas', 'Libur'] })
    .notNull()
    .default('Tersedia'),
  simJenis: text('sim_jenis').notNull().default('SIM A'),
  simExpiry: date('sim_expiry'),
  foto: text('foto'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('driver_deleted_idx').on(table.deletedAt),
]);

export const booking = pgTable('booking', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  vehicleId: text('vehicle_id').references(() => vehicle.id, {
    onDelete: 'set null',
  }),
  driverId: text('driver_id').references(() => driver.id, {
    onDelete: 'set null',
  }),
  jenisKendaraan: text('jenis_kendaraan', { enum: ['Mobil', 'Motor'] })
    .notNull()
    .default('Mobil'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  keperluan: text('keperluan').notNull(),
  jumlahPenumpang: integer('jumlah_penumpang').notNull().default(1),
  perluSopir: boolean('perlu_sopir').notNull().default(false),
  status: text('status', {
    enum: [
      'Pending',
      'Disetujui',
      'Berlangsung',
      'Selesai',
      'Selesai dengan Catatan',
      'Ditolak',
      'Dibatalkan',
    ],
  })
    .notNull()
    .default('Pending'),
  catatan: text('catatan'),
  alasanPenolakan: text('alasan_penolakan'),
  odometerStart: integer('odometer_start'),
  odometerEnd: integer('odometer_end'),
  kondisiBBM: text('kondisi_bbm'),
  kondisiKebersihan: text('kondisi_kebersihan'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('booking_user_idx').on(table.userId),
  index('booking_vehicle_idx').on(table.vehicleId),
  index('booking_driver_idx').on(table.driverId),
  index('booking_status_idx').on(table.status),
  index('booking_time_range_idx').on(table.startTime, table.endTime),
]);

export const bookingReview = pgTable('booking_review', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  bookingId: text('booking_id')
    .notNull()
    .unique()
    .references(() => booking.id, { onDelete: 'cascade' }),
  reviewNotes: text('review_notes').notNull(),
  isNew: boolean('is_new').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const chatMessage = pgTable('chat_message', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  senderId: text('sender_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  receiverId: text('receiver_id')
    .references(() => user.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('chat_msg_sender_idx').on(table.senderId),
  index('chat_msg_receiver_idx').on(table.receiverId),
  index('chat_msg_created_idx').on(table.createdAt),
]);

// ─────────────────────────────────────────────
//  Superadmin Domain Tables
// ─────────────────────────────────────────────

export const activityLog = pgTable('activity_log', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  userName: text('user_name').notNull(),
  action: text('action', {
    enum: [
      // Auth events
      'LOGIN', 'LOGOUT', 'PASSWORD_CHANGED',
      // Booking — user
      'BOOKING_CREATED', 'BOOKING_CANCELLED', 'BOOKING_REVIEW',
      // Booking — admin
      'BOOKING_APPROVED', 'BOOKING_REJECTED', 'BOOKING_MANDATORY',
      'BOOKING_STARTED', 'BOOKING_COMPLETED',
      // Fleet — admin
      'VEHICLE_CREATED', 'VEHICLE_UPDATED', 'VEHICLE_DELETED',
      'DRIVER_CREATED', 'DRIVER_UPDATED', 'DRIVER_DELETED',
      // Superadmin — account management
      'ACCOUNT_CREATED', 'ACCOUNT_DELETED', 'ACCOUNT_ROLE_CHANGED', 'ACCOUNT_PASSWORD_RESET',
      // Superadmin — system
      'SERVICE_TOGGLED',
      // Profile
      'PROFILE_UPDATED',
    ]
  }).notNull(),
  targetId: text('target_id'),
  targetName: text('target_name'),
  detail: text('detail'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('activity_log_user_idx').on(table.userId),
  index('activity_log_created_at_idx').on(table.createdAt),
]);

export const systemSettings = pgTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
});

export const pushSubscription = pgTable('push_subscription', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('push_sub_user_idx').on(table.userId),
]);
