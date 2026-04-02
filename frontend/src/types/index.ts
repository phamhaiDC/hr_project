// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
}

export interface LoginResponse {
  accessToken: string;   // backend key: accessToken (camelCase)
  employee: AuthUser;    // backend key: employee (not user)
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Organization ─────────────────────────────────────────────────────────────

export interface Department {
  id: number;
  name: string;
}

export interface Position {
  id: number;
  name: string;
}

export interface Branch {
  id: number;
  name: string;
}

// ─── Employee ─────────────────────────────────────────────────────────────────

export interface Employee {
  id: number;
  code: string;
  fullName: string;
  email: string;
  phone?: string;
  status: 'probation' | 'official' | 'resigned';
  role: 'admin' | 'hr' | 'manager' | 'employee';
  branchId?: number;
  departmentId?: number;
  positionId?: number;
  managerId?: number;
  joinDate?: string;
  probationEndDate?: string;
  createdAt?: string;
  updatedAt?: string;
  branch?: Branch;
  department?: Department;
  position?: Position;
  manager?: Pick<Employee, 'id' | 'fullName' | 'email' | 'code'>;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

export interface Contract {
  id: number;
  employeeId?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  createdAt?: string;
  employee?: Pick<Employee, 'id' | 'fullName' | 'code' | 'department' | 'position'>;
}

// ─── Leave ────────────────────────────────────────────────────────────────────

export type LeaveType = 'annual' | 'sick' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveApproval {
  id: number;
  step: number;
  approverRole: string;
  approverId?: number;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  actionTime?: string;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  fromDate: string;
  toDate: string;
  type: LeaveType;
  status: LeaveStatus;
  currentStep: number;
  reason: string;
  days: number;
  createdAt: string;
  employee?: Pick<Employee, 'id' | 'fullName' | 'email' | 'code' | 'department' | 'manager'>;
  approvals?: LeaveApproval[];
}

export interface LeaveBalance {
  employeeId: number;
  total: number;
  used: number;
  remaining: number;
  updatedAt?: string;
}

export interface LeaveAccrualLog {
  id: number;
  employeeId: number;
  days: number;
  note?: string | null;
  accrualDate: string;
  createdAt: string;
}

export interface LeaveBalanceWithLog {
  balance: LeaveBalance | null;
  accrualLog: LeaveAccrualLog[];
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface Shift {
  id: number;
  name: string;
  startTime: string;   // "HH:MM"
  endTime: string;     // "HH:MM"
  breakMinutes: number;
  graceLateMinutes: number;
  graceEarlyMinutes: number;
  isDefault: boolean;
}

export interface WorkLocation {
  id: number;
  name: string;
  lat: number;
  lng: number;
  radius: number;      // metres
  address?: string;
}

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  checkinTime?: string;
  checkoutTime?: string;
  workingHours?: number | string;  // Prisma Decimal serializes as string in JSON
  // WFM fields
  shiftId?: number;
  shift?: Shift;
  isLate: boolean;
  isEarlyOut: boolean;
  isOvertime: boolean;
  overtimeHours?: number | string;  // Prisma Decimal serializes as string in JSON
  checkinLat?: number;
  checkinLng?: number;
  checkoutLat?: number;
  checkoutLng?: number;
  // Leave integration
  isOnLeave?: boolean;
  leaveRequestId?: number | null;
  employee?: Pick<Employee, 'id' | 'fullName' | 'code' | 'department' | 'position'>;
}

export interface AttendanceLog {
  id: number;
  employeeId: number;
  time: string;
  type: 'check_in' | 'check_out';
  lat?: number;
  lng?: number;
  locationId?: number;
  deviceId?: string;
  distanceM?: number;
  attendanceId?: number;
}

export interface TodayStatus {
  date: string;
  attendance: AttendanceRecord | null;
  checkedIn: boolean;
  checkedOut: boolean;
  dayInfo?: DayInfo;
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export type DayType = 'WORKING' | 'WEEKEND' | 'HOLIDAY' | 'COMPENSATION';

export interface DayInfo {
  date: string;
  type: DayType;
  isPaid: boolean;
  note?: string | null;
  isWorkingDay: boolean;
}

export interface CalendarYear {
  id: number;
  year: number;
  weekendDays: number[];  // 0=Sun … 6=Sat
  country?: string;
  description?: string;
  _count?: { days: number };
}

export interface CalendarDay {
  id: number;
  year: number;
  date: string;
  type: DayType;
  isPaid: boolean;
  note?: string | null;
}

export interface Holiday {
  id: number;
  name: string;
  fromDate: string;
  toDate: string;
  isPaid: boolean;
  isRecurring: boolean;
  description?: string | null;
  createdAt: string;
}

export interface CalendarSummary {
  year: number;
  WORKING: number;
  WEEKEND: number;
  HOLIDAY: number;
  COMPENSATION: number;
  total: number;
}

// ─── Resignation ──────────────────────────────────────────────────────────────

export type ResignationStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface ResignationApproval {
  id: number;
  step: number;
  approverRole: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  actionTime?: string;
}

export interface ResignationRequest {
  id: number;
  employeeId: number;
  lastWorkingDate: string;
  reason: string;
  status: ResignationStatus;
  currentStep: number;
  createdAt: string;
  employee?: Pick<Employee, 'id' | 'fullName' | 'email' | 'code' | 'department' | 'manager'>;
  approvals?: ResignationApproval[];
}
