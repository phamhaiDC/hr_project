# HR Project — Context

## Overview
HR Management System for **Dcorp** (~150 employees, 2 branches: HCM & HN).
Full-stack monorepo: NestJS backend + Next.js frontend + PostgreSQL via Prisma.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS 10, Prisma 5, PostgreSQL |
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5, TailwindCSS 4 |
| Auth | JWT (passport-jwt), role-based guards |
| Docs | Swagger (@nestjs/swagger) |
| Schedule | @nestjs/schedule (cron jobs) |
| i18n | i18next, react-i18next |
| Extras | ExcelJS (export), GPS tracking, Telegram integration |

---

## Monorepo Structure

```
hr-project/
├── backend/          # NestJS API
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── attendance/
│   │   ├── audit/
│   │   ├── auth/
│   │   ├── calendar/
│   │   ├── common/
│   │   ├── contract/
│   │   ├── employee/
│   │   ├── leave/
│   │   ├── me/
│   │   ├── notification/
│   │   ├── offboarding/
│   │   ├── office/
│   │   ├── organization/
│   │   ├── prisma/
│   │   ├── reward/
│   │   ├── system-config/
│   │   ├── workflow/
│   │   └── working-shift/
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
├── frontend/         # Next.js App Router
│   └── src/
│       ├── app/          # Routes (pages)
│       ├── components/   # Shared UI components
│       ├── context/      # React contexts
│       ├── hooks/        # Custom hooks
│       ├── lib/          # Utilities/helpers
│       ├── locales/      # i18n translation files
│       ├── modules/      # Feature-scoped components
│       ├── services/     # API call services
│       ├── types/        # TypeScript types
│       └── utils/
└── mobile/           # (planned)
```

---

## Frontend Routes (`frontend/src/app/`)

| Route | Description |
|---|---|
| `/` | Dashboard |
| `/login` | Authentication |
| `/employees` | Employee list (HR/Admin) |
| `/profile` | Self-service profile |
| `/leave` | Leave requests |
| `/attendance` | Attendance records |
| `/departments` | Department management |
| `/positions` | Position management |
| `/branches` | Branch management |
| `/calendar` | Calendar & holidays |
| `/working-shifts` | Shift management |
| `/offboarding` | Resignation & offboarding |
| `/reports` | Reports |
| `/settings` | System config |

---

## Backend Modules

| Module | Key Files | Responsibility |
|---|---|---|
| `auth` | auth.controller, auth.service | JWT login, profile, password change |
| `employee` | employee.controller, employee.service | CRUD employees, role management |
| `leave` | leave.controller, leave.service, leave-balance.service, leave-approval.service, workflow-engine.service | Leave requests, balances, multi-step approvals |
| `attendance` | attendance.controller, attendance.service, attendance-processor.service, shift.service, location.service | Check-in/out (GPS), shift assignment, import |
| `organization` | organization.controller, organization.service | Departments, positions, branches |
| `offboarding` | offboarding.controller, offboarding.service, offboarding-approval.service | Resignation requests, checklist, approvals |
| `calendar` | calendar service | Calendar years, working days, holidays |
| `contract` | contract service | Employee contracts |
| `audit` | audit service | Audit log for all mutations |
| `notification` | notification service | In-app + Telegram notifications |
| `workflow` | workflow module | Configurable approval flows |
| `working-shift` | shift service | Shift definitions |
| `system-config` | system-config service | Key-value app configuration |
| `me` | self-service endpoints | Current user's own data |
| `reward` | reward module | Decisions (bonus/disciplinary) |

---

## Database Models (Prisma)

**Organization**
- `Branch` — chi nhánh (HCM, HN), GPS radius
- `Department` — phòng ban, linked to branch, working type
- `Position` — chức danh, linked to department
- `OfficeLocation` — văn phòng

**Employee**
- `Employee` — core model; fields: code, fullName, email, phone, role (`admin|hr|manager|employee`), status, joinDate, probationEndDate, managerId (self-ref), workingMode, shiftId, telegramId

**Leave**
- `LeaveRequest` — type, fromDate, toDate, days, status, multi-step approval
- `LeaveApproval` — per step: approver, status, comments
- `LeaveBalance` — total / used / remaining (Decimal 10,1)
- `LeaveAccrualLog` — accrual history

**Attendance**
- `Attendance` — daily record: checkin/checkout time+GPS, isLate, isEarlyOut, isOvertime, overtimeHours, shiftId
- `AttendanceLog` — raw punch events (GPS)
- `AttendanceRaw` — import raw data
- `Shift` — shift definition: startTime, endTime, grace periods, isCrossDay
- `EmployeeShiftAssignment` — shift assignment history

**Offboarding**
- `ResignationRequest` — lastWorkingDate, reason, multi-step status
- `ResignationApproval` — per step approval
- `OffboardingChecklist` — checklist items per employee

**Other**
- `Contract` — employment contracts
- `Decision` — bonus/disciplinary decisions
- `EmployeeHistory` — field-level change history
- `AuditLog` — action logs with JSON details
- `CalendarYear` — year config, weekend days
- `CalendarDay` — holiday/special day per date
- `ApprovalFlow` / `ApprovalStep` — configurable multi-step flows
- `SystemConfig` — key-value app settings
- `WorkLocation` — GPS work locations

---

## Frontend Services (`frontend/src/services/`)

| File | Covers |
|---|---|
| `employee.service.ts` | Employee CRUD, list, detail |
| `leave.service.ts` | Leave requests, approvals, balance |
| `attendance.service.ts` | Attendance records, check-in/out |
| `organization.service.ts` | Departments, positions, branches |
| `auth.service.ts` | Login, profile, password |
| `calendar.service.ts` | Calendar years, holidays |
| `contract.service.ts` | Contracts |
| `offboarding.service.ts` | Resignation, offboarding |
| `working-shift.service.ts` | Shifts |
| `system-config.service.ts` | App config |
| `audit.service.ts` | Audit logs |

---

## Frontend Feature Modules (`frontend/src/modules/`)

| Module | Components |
|---|---|
| `employee` | CreateEmployeeModal, EditEmployeeModal, EmployeeTable, EmployeeProfile, EmployeeAvatar, EmployeeHistory, ChangePasswordModal |
| `leave` | CreateLeaveModal, PendingApprovals, RejectModal, LeaveTimeline |
| `auth` | Login flow |
| `attendance` | Attendance views |
| `dashboard` | Dashboard widgets |

---

## Roles & Permissions

| Role | Access |
|---|---|
| `admin` | Full access |
| `hr` | Manage employees, leave, attendance, org |
| `manager` | Approve leave/resignation for subordinates |
| `employee` | Self-service: profile, leave requests, attendance view |

---

## Key Business Rules

- **Leave**: multi-step approval (configurable via ApprovalFlow); balance tracked as Decimal
- **Attendance**: GPS-based check-in/out; supports import from external device; late/early-out/overtime auto-calculated
- **Offboarding**: resignation → multi-step approval → offboarding checklist
- **Employee lifecycle**: all field changes tracked in `EmployeeHistory`; all actions in `AuditLog`
- **No payroll module** — scope excluded
- **No external integrations** except Telegram notifications

---

## Constraints & Notes

- Attendance import only (no live device integration) — `AttendanceRaw` table for imports
- Future scaling: designed for multi-branch, multi-department
- Mobile app planned (see `mobile/` folder and `prompt_mobile_wfm.md`)
