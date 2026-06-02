# Hotel Booking System

Fullstack hotel booking app: React + SCSS (client) and Node.js + Express + PostgreSQL (server).

## Structure

```
hotel-booking/
├── client/     # React SPA (Vite)
└── server/     # Express REST API
```

## Setup

### 1. Database

```bash
createdb hotel_db
psql -d hotel_db -f server/src/db/schema.sql
```

### 2. Server

```bash
cd server
cp .env.example .env
# edit DATABASE_URL, JWT_SECRET
npm install
npm run dev
```

API: http://localhost:5000

### 3. Client

```bash
cd client
npm install
npm run dev
```

App: http://localhost:5173

## Default admin (after seed)

- Email: `admin@hotel.com`
- Password: `admin123`

Change password in production.

## API overview

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/login` | — |
| GET | `/api/auth/me` | JWT |
| GET | `/api/rooms` | — |
| GET | `/api/rooms/:id` | — |
| POST | `/api/bookings` | JWT |
| GET | `/api/bookings/my` | JWT |
| GET/POST/PUT/DELETE | `/api/admin/rooms` | Admin |
| GET | `/api/admin/bookings` | Admin |
