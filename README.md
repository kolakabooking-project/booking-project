# 🚗 BOOKOLAKA — Sistem Peminjaman Kendaraan Dinas

**KPP Pratama Kolaka** — Fleet Booking Management System

Aplikasi web modern untuk pengelolaan peminjaman kendaraan dinas, dibangun dengan React + Express.js + PostgreSQL.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, TailwindCSS 3, Framer Motion |
| **Backend** | Express.js 5, TypeScript, Drizzle ORM |
| **Database** | PostgreSQL (NeonDB) |
| **Auth** | Better Auth (cookie-based sessions) |
| **Realtime** | Ably WebSockets |
| **Deployment** | Vercel (Frontend + Serverless API) |

## 📁 Project Structure

```
booking-project/
├── api/                  # Vercel Serverless Function entry
│   └── index.ts
├── public/               # Static assets
├── src/                  # React frontend
│   ├── components/
│   ├── contexts/
│   ├── lib/
│   ├── pages/
│   └── utils/
├── server/               # Express.js backend
│   └── src/
│       ├── auth/         # Better Auth config
│       ├── config/       # DB & env config
│       ├── db/           # Schema, relations, seeds
│       ├── lib/          # Ably client
│       ├── middleware/   # Auth & role guards
│       ├── routes/       # API routes
│       ├── services/     # Business logic
│       └── utils/        # Helpers
├── vercel.json           # Deployment config
└── .env.example          # Environment template
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (local) or NeonDB account

### Local Development

```bash
# 1. Install dependencies
npm install
cd server && npm install && cd ..

# 2. Setup environment
cp server/.env.example server/.env
# Edit server/.env with your database URL

# 3. Push schema to database
cd server && npm run db:push

# 4. Seed users (optional)
cd server && npx tsx src/db/seed-pegawai.ts

# 5. Start development servers
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
npm run dev
```

### Production Deployment (Vercel)

1. Push to GitHub
2. Import repo in [Vercel Dashboard](https://vercel.com)
3. Set environment variables (see `.env.example`)
4. Deploy!

## 🔐 Security

- Cookie-based auth with HttpOnly, Secure, SameSite
- Helmet security headers + CSP
- Rate limiting (auth: 20/15min, API: 300/15min)
- AES-256-GCM chat encryption
- Zod validation on all env vars
- CORS strict-origin in production
- HSTS with preload
- SQL injection prevention (Drizzle ORM parameterized queries)

## 📄 License

Internal use only — KPP Pratama Kolaka.
