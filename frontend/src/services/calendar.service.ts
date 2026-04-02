import api from '@/lib/axios';
import type {
  CalendarYear,
  CalendarDay,
  CalendarSummary,
  Holiday,
  DayInfo,
} from '@/types';

// ─── Payload types ────────────────────────────────────────────────────────────

export interface CreateCalendarYearPayload {
  year: number;
  weekendDays: number[];
  country?: string;
  description?: string;
  autoGenerate?: boolean;
}

export interface UpdateCalendarDayPayload {
  type: 'WORKING' | 'WEEKEND' | 'HOLIDAY' | 'COMPENSATION';
  isPaid?: boolean;
  note?: string;
}

export interface CreateHolidayPayload {
  name: string;
  fromDate: string;
  toDate: string;
  isPaid?: boolean;
  isRecurring?: boolean;
  description?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const calendarService = {
  // ── Year config ──────────────────────────────────────────────────────────────

  listYears: () =>
    api.get<CalendarYear[]>('/calendar/years').then((r) => r.data),

  createYear: (payload: CreateCalendarYearPayload) =>
    api.post<CalendarYear>('/calendar/years', payload).then((r) => r.data),

  updateYear: (year: number, payload: Partial<CreateCalendarYearPayload>) =>
    api.patch<CalendarYear>(`/calendar/years/${year}`, payload).then((r) => r.data),

  /** Generate / regenerate all CalendarDay rows for a year */
  generate: (year: number) =>
    api
      .post<{ generated: number; skipped: number }>(`/calendar/years/${year}/generate`)
      .then((r) => r.data),

  // ── Day queries ───────────────────────────────────────────────────────────────

  /** Get all CalendarDay rows for a year (and optionally a month 1-12) */
  getDays: (year: number, month?: number) =>
    api
      .get<CalendarDay[]>('/calendar', {
        params: { year: String(year), ...(month != null && { month: String(month) }) },
      })
      .then((r) => r.data),

  /** Check a specific date's type (WORKING/WEEKEND/HOLIDAY/COMPENSATION) */
  checkDay: (date: string) =>
    api.get<DayInfo>('/calendar/check', { params: { date } }).then((r) => r.data),

  /** Manual override for a single day */
  updateDay: (date: string, payload: UpdateCalendarDayPayload) =>
    api.patch<CalendarDay>(`/calendar/day/${date}`, payload).then((r) => r.data),

  /** Working/weekend/holiday counts for a year */
  getSummary: (year: number) =>
    api.get<CalendarSummary>('/calendar/summary', { params: { year: String(year) } }).then((r) => r.data),

  // ── Holidays ──────────────────────────────────────────────────────────────────

  getHolidays: (year?: number) =>
    api.get<Holiday[]>('/holiday', { params: year != null ? { year: String(year) } : {} }).then((r) => r.data),

  createHoliday: (payload: CreateHolidayPayload) =>
    api.post<Holiday>('/holiday', payload).then((r) => r.data),

  updateHoliday: (id: number, payload: Partial<CreateHolidayPayload>) =>
    api.patch<Holiday>(`/holiday/${id}`, payload).then((r) => r.data),

  deleteHoliday: (id: number) =>
    api.delete(`/holiday/${id}`).then((r) => r.data),
};
