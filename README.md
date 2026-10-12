# PawCliniQ

Vet appointment booking for pet parents: sign up, keep pet profiles, find a
clinic and vet, and book a time slot.

```
Frontend/   React 19 + Vite + Tailwind 4
Backend/    Express 5 + Prisma 7 + PostgreSQL (Neon)
```

In production one Node service runs everything: Express serves the API under
`/api` and the built React app for every other path. Frontend and API share
an origin, so the session is a first-party httpOnly cookie and there's no CORS.

## Run locally

Needs Node 22+ and a Postgres database (Neon, or local
`brew services start postgresql@18`).

```sh
cp Backend/.env.example Backend/.env    # fill in DATABASE_URL, JWT_SECRET, SEED_ADMIN_PASSWORD
npm run install:all
npm run db:migrate --prefix Backend     # create tables
npm run db:seed --prefix Backend        # clinics, vets, demo + admin accounts

npm run dev:api                         # terminal 1 — API on :4000
npm run dev:web                         # terminal 2 — app on :5173 (proxies /api)
```


## API

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/signup` · `/api/auth/login` · `/api/auth/logout` | — |
| GET | `/api/auth/me` | — (returns `user: null` when logged out) |
| GET | `/api/clinics?service=` · `/api/clinics/:id/vets` | — |
| GET | `/api/vets/:id/booked-slots?date=YYYY-MM-DD` | user |
| GET, POST | `/api/pets` | user |
| GET, PUT, DELETE | `/api/pets/:id` | owner |
| GET | `/api/bookings?petId=` | user (admin: all) |
| POST | `/api/bookings` | user |
| PATCH | `/api/bookings/:id/cancel` | owner or admin |
| DELETE | `/api/bookings/:id` (cancelled or past only) | owner or admin |
| GET, PATCH, PUT, DELETE | `/api/booking-draft` (in-progress booking) | user |
| GET | `/api/health` | — |

Rules the server enforces: one active booking per vet per slot (database
index), the clinic must offer the service, the vet must work that weekday,
no past slots, a 14-day booking window, unique pet names per owner, and users
only ever see their own pets and bookings. Appointment times are IST.

Nothing is stored in the browser except the httpOnly session cookie. The
booking flow (pet → clinic → vet → time) saves each step to
`booking_drafts`, one row per user, so it survives refreshes and works across
devices. Booking deletes the draft, and a draft untouched for 24 hours is
ignored.

## Deploy (Render + Neon)

`render.yaml` defines the service. On Render: **New → Blueprint**, pick this
repo, then set `DATABASE_URL` (Neon direct) and `DATABASE_URL_POOLED` (Neon
pooled); `JWT_SECRET` is generated. The build installs both apps, builds the
frontend and applies pending migrations. Seed once from your machine against
the production database: `npm run db:seed --prefix Backend`.

`psql` against Neon: `PGSSLROOTCERT=system psql "$DATABASE_URL"`.
