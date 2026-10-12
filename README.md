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
npm run db:seed --prefix Backend        # clinics, vets, admin (+ demo owner if SEED_DEMO_PASSWORD is set)

npm run dev:api                         # terminal 1 — API on :4000
npm run dev:web                         # terminal 2 — app on :5173 (proxies /api)
```


## API

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/signup` · `/api/auth/login` · `/api/auth/logout` | — |
| GET | `/api/auth/me` | — (returns `user: null` when logged out) |
| GET | `/api/clinics?service=&visit=home` · `/api/clinics/:id/vets` | — |
| GET | `/api/vets/:id/booked-slots?date=YYYY-MM-DD` | user |
| GET, POST | `/api/pets` | user |
| GET, PUT, DELETE | `/api/pets/:id` | owner |
| GET | `/api/bookings?petId=` | user (admin: all) |
| POST | `/api/bookings` | user |
| PATCH | `/api/bookings/:id/cancel` (staff may send `reason`) | owner, clinic or admin |
| PATCH | `/api/bookings/:id/status` (`completed` / `no_show`) | clinic or admin |
| DELETE | `/api/bookings/:id` (cancelled or past only) | owner or admin |
| GET, PATCH, PUT, DELETE | `/api/booking-draft` (in-progress booking) | user |
| GET, POST, PUT | `/api/admin/clinics[/:id]` · `POST /api/admin/clinics/:id/vets` · `PUT /api/admin/vets/:id` | admin |
| POST, DELETE | `/api/admin/clinics/:id/staff` · `/api/admin/staff/:id` (clinic logins) | admin |
| GET | `/api/health` | — |

Rules the server enforces: one active booking per vet per slot (database
index), the clinic must offer the service, the clinic must be open and the
vet must work that weekday, the time must be one of the vet's slots, no past
slots, a 14-day booking window, unique pet names per owner, and users
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

## Accounts and pages

- **Pet owners** sign up themselves and book from the booking flow.
- **Clinic staff** (`role: clinic`) log in at `/login` and land on
  `/clinic`: their clinic's appointments only (Today / Upcoming / Past /
  Cancelled), with owner contact details, Navigate for home visits, and
  Completed / No-show / Cancel-with-reason. Admins create these logins.
- **Admin** (`admin@gmail.com`) lands on `/admin`: add and edit clinics
  (details, services, open days and hours, slot length, home visits,
  active), their vets (working days, own shift, active) and clinic logins.
  `/bookings` shows every booking.

The seed only creates the sample clinics, vets and accounts that are
missing; after that, clinics and vets are managed in the admin panel.

## Opening hours

Clinics have open days and opening/closing times (IST); "Open 24 hours" is
`00:00`–`24:00`. A vet can have their own shift; an end before the start is an
overnight shift (e.g. 20:00–08:00). Bookable slots are generated from these,
and the server only accepts those times.

## Visits and directions

Bookings are a clinic visit (default) or a home visit. Choosing "Home visit"
only lists clinics that offer it, and the booking must include the owner's
address. Each clinic card has a "Get directions" link that opens Google Maps
to the clinic's address.
