# Changelog

## v1.0-stable — 2026-04-02

### Initial stable release

First production-ready version of the HR Management System.

---

### Features

#### Authentication
- JWT-based login (`POST /api/v1/auth/login`)
- Token stored in `localStorage` + `hr_token` cookie (edge middleware reads cookie)
- `GET /api/v1/auth/profile` — verify token & return current user
- Next.js middleware protects all non-login routes; redirects unauthenticated users to `/login`
- Axios interceptor attaches `Authorization: Bearer <token>` to every request
- 401 response clears token and redirects to `/login` (loop-safe: skips redirect when already on `/login`)
- AbortController-based token verification with 5 s timeout; keeps optimistic session on cancel

#### Employee Management
- `GET /api/v1/employees` — paginated employee list (search, department, status filters)
- `POST /api/v1/employees` — create employee
- `GET /api/v1/employees/:id` — employee detail with contract, department, position
- `PATCH /api/v1/employees/:id` — update employee
- Role-based access: `admin` / `hr` can create & edit; `employee` read-only
- Frontend: `/employees` page with table, search, pagination

#### Leave Management
- Leave types with configurable accrual (annual, sick, etc.)
- `POST /api/v1/leave/requests` — submit leave request
- `GET /api/v1/leave/requests` — list requests (own or all for managers)
- Approval workflow: `PENDING → APPROVED / REJECTED`
- Leave balance tracking with accrual log
- Calendar integration: approved leaves reflected in work calendar
- Frontend: `/leave` page with request form, status badges, balance display

#### Attendance (Basic)
- `POST /api/v1/attendance/check-in` — record check-in (optional GPS + device ID)
- `POST /api/v1/attendance/check-out` — record check-out, returns working hours
- `GET /api/v1/attendance/today` — today's check-in/out status
- `GET /api/v1/attendance/me` — personal attendance history (paginated)
- `GET /api/v1/attendance/report` — manager/HR report with date range, department filters
- Late / early-out / overtime detection against shift schedule
- Frontend: `/attendance` page with check-in/out button, personal history, manager report panel

#### Work Calendar
- Calendar years with configurable weekend days
- Holiday management (paid/unpaid, recurring)
- Day-type overrides: `WORKING | WEEKEND | HOLIDAY | COMPENSATION`
- `GET /api/v1/calendar` — all days for a year (optional month filter)
- `GET /api/v1/calendar/summary` — counts by type for a year
- Frontend: `/calendar` page with month grid, legend, summary bar, holiday list

#### Organization
- Branches, Departments, Positions hierarchy
- Employees linked to department + position
- Frontend: referenced in employee forms and filters

---

### Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Backend  | NestJS 10, Prisma ORM, PostgreSQL   |
| Frontend | Next.js 16.2.1 (Turbopack), React 19, Tailwind CSS 4 |
| Auth     | JWT (`@nestjs/jwt`), Passport       |
| API      | REST, global prefix `/api/v1`       |
| Proxy    | Next.js catch-all route handler (`src/app/api/v1/[...path]/route.ts`) |

---

### Database

- 6 migrations applied (see `backend/prisma/migrations/`)
- Schema: `backend/prisma/schema.prisma` (418 lines)
- Seed: `backend/prisma/seed.ts`

---

### Known Configuration

- Backend binds to `0.0.0.0:3001`
- Frontend dev server binds to `0.0.0.0:3000` (`--hostname 0.0.0.0`)
- `NEXT_PUBLIC_API_URL=/api/v1` (relative — works for both localhost and LAN access)
- `BACKEND_INTERNAL_URL=http://localhost:3001` (server-side proxy target)
