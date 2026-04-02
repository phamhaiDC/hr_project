'use client';

import { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { PageSpinner, Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePagination } from '@/hooks/usePagination';
import { attendanceService } from '@/services/attendance.service';
import { formatDate, formatDateTime, formatHours } from '@/utils/format';
import type { TodayStatus, AttendanceRecord, WorkLocation, PaginatedResponse } from '@/types';

// ─── Haversine (client-side preview distance) ─────────────────────────────────

function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
}

// ─── Status badge helpers ──────────────────────────────────────────────────────

function WfmBadges({ record }: { record: AttendanceRecord }) {
  return (
    <div className="flex flex-wrap gap-1">
      {record.isLate && <Badge label="Late" variant="danger" />}
      {record.isEarlyOut && <Badge label="Early Out" variant="warning" />}
      {record.isOvertime && (
        <Badge label={`OT ${Number(record.overtimeHours).toFixed(1)}h`} variant="info" />
      )}
      {!record.isLate && !record.isEarlyOut && !record.isOvertime && record.checkinTime && (
        <Badge label="On Time" variant="success" />
      )}
    </div>
  );
}

// ─── GPS Panel ────────────────────────────────────────────────────────────────

interface GpsPanelProps {
  locations: WorkLocation[];
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  geoError: string | null;
  geoLoading: boolean;
}

function GpsPanel({ locations, lat, lng, accuracy, geoError, geoLoading }: GpsPanelProps) {
  // Find nearest location client-side for live preview
  let nearest: { name: string; distanceM: number; withinRadius: boolean } | null = null;
  if (lat != null && lng != null && locations.length > 0) {
    let minDist = Infinity;
    for (const loc of locations) {
      const d = haversineMetres(lat, lng, loc.lat, loc.lng);
      if (d < minDist) {
        minDist = d;
        nearest = { name: loc.name, distanceM: Math.round(d), withinRadius: d <= loc.radius };
      }
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">GPS Status</p>

      {geoLoading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Spinner className="h-4 w-4" /> Acquiring position…
        </div>
      ) : geoError ? (
        <p className="text-amber-600">{geoError}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-700">
            <span className="text-gray-400">Lat</span>
            <span className="font-mono">{lat?.toFixed(6)}</span>
            <span className="text-gray-400">Lng</span>
            <span className="font-mono">{lng?.toFixed(6)}</span>
            <span className="text-gray-400">Accuracy</span>
            <span>±{accuracy} m</span>
          </div>

          {nearest && (
            <div className={`mt-2 rounded-lg border px-3 py-2 ${nearest.withinRadius ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
              <p className="font-medium">{nearest.name}</p>
              <p className="text-xs">
                {fmtDistance(nearest.distanceM)} away ·{' '}
                {nearest.withinRadius ? '✓ Within geofence' : '✗ Outside geofence'}
              </p>
            </div>
          )}

          {locations.length === 0 && (
            <p className="text-gray-400 text-xs">No work locations configured (GPS check skipped)</p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const { user } = useAuth();
  const geo = useGeolocation();

  // Today's status
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Work locations (for distance preview)
  const [locations, setLocations] = useState<WorkLocation[]>([]);

  // My history (paginated)
  const [myRecords, setMyRecords] = useState<PaginatedResponse<AttendanceRecord> | null>(null);
  const [myLoading, setMyLoading] = useState(true);
  const { page: myPage, limit: myLimit, next: myNext, prev: myPrev } = usePagination(10);

  // Admin report
  const isManager = user && ['admin', 'hr', 'manager'].includes(user.role);
  const [report, setReport] = useState<(PaginatedResponse<AttendanceRecord> & { summary?: { totalWorkingHours: number; totalRecords: number } }) | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  // dateFrom / dateTo drive the form inputs only.
  // activeFilter is only updated on submit — keeps loadReport stable while typing.
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeFilter, setActiveFilter] = useState({ dateFrom: '', dateTo: '' });
  const { page, limit, next, prev, reset } = usePagination(20);

  // ── Load today status + locations ──────────────────────────────────────────
  useEffect(() => {
    Promise.allSettled([
      attendanceService.today(),
      attendanceService.locations(),
    ]).then(([todayRes, locRes]) => {
      if (todayRes.status === 'fulfilled') setTodayStatus(todayRes.value);
      if (locRes.status === 'fulfilled') setLocations(locRes.value);
      setTodayLoading(false);
    });
  }, []);

  // ── Load my records ────────────────────────────────────────────────────────
  const loadMyRecords = useCallback(async () => {
    setMyLoading(true);
    console.log('[attendance] Loading my records, page:', myPage);
    try {
      const data = await attendanceService.me({ page: myPage, limit: myLimit });
      console.log('[attendance] My records:', data.meta.total, 'total');
      setMyRecords(data);
    } catch (err) {
      console.error('[attendance] Failed to load my records:', err);
    } finally {
      setMyLoading(false);
    }
  }, [myPage, myLimit]);

  useEffect(() => { loadMyRecords(); }, [loadMyRecords]);

  // ── Load admin report ──────────────────────────────────────────────────────
  const loadReport = useCallback(async () => {
    if (!isManager) return;
    setReportLoading(true);
    console.log('[attendance] Loading report, page:', page, 'filter:', activeFilter);
    try {
      const data = await attendanceService.report({
        page,
        limit,
        dateFrom: activeFilter.dateFrom || undefined,
        dateTo: activeFilter.dateTo || undefined,
      });
      console.log('[attendance] Report:', data.meta.total, 'records,', data.summary?.totalWorkingHours, 'total hours');
      setReport(data);
    } catch (err) {
      console.error('[attendance] Failed to load report:', err);
    } finally {
      setReportLoading(false);
    }
  // activeFilter.dateFrom / .dateTo are primitives — safe in dep array.
  // Raw dateFrom/dateTo inputs are intentionally excluded so typing doesn't
  // trigger a fetch; only an explicit form submit (which sets activeFilter) does.
  }, [page, limit, activeFilter.dateFrom, activeFilter.dateTo, isManager]);

  useEffect(() => { loadReport(); }, [loadReport]);

  // ── Check-in / Check-out ───────────────────────────────────────────────────
  async function handleCheckIn() {
    setActionMsg(null);
    setActionLoading(true);
    console.log('[attendance] Check-in, GPS:', geo.lat, geo.lng);
    try {
      const result = await attendanceService.checkIn({
        lat: geo.lat ?? undefined,
        lng: geo.lng ?? undefined,
      });
      console.log('[attendance] Check-in success:', result);
      const msg = result.isLate
        ? `Checked in at ${formatDateTime(result.attendance.checkinTime)} — marked LATE`
        : `Checked in at ${formatDateTime(result.attendance.checkinTime)} — on time`;
      setActionMsg({ type: result.isLate ? 'error' : 'success', text: msg });
      // Refresh today status and my records
      const fresh = await attendanceService.today();
      setTodayStatus(fresh);
      loadMyRecords();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Check-in failed. Please try again.';
      console.error('[attendance] Check-in failed:', msg);
      setActionMsg({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    setActionMsg(null);
    setActionLoading(true);
    console.log('[attendance] Check-out, GPS:', geo.lat, geo.lng);
    try {
      const result = await attendanceService.checkOut({
        lat: geo.lat ?? undefined,
        lng: geo.lng ?? undefined,
      });
      console.log('[attendance] Check-out success:', result);
      let msg = `Checked out · ${Number(result.workingHours).toFixed(1)}h worked`;
      if (result.isOvertime) msg += ` · OT ${Number(result.overtimeHours).toFixed(1)}h`;
      if (result.isEarlyOut) msg += ' · Early out';
      setActionMsg({ type: 'success', text: msg });
      const fresh = await attendanceService.today();
      setTodayStatus(fresh);
      loadMyRecords();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Check-out failed. Please try again.';
      console.error('[attendance] Check-out failed:', msg);
      setActionMsg({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const checkedIn = todayStatus?.checkedIn ?? false;
  const checkedOut = todayStatus?.checkedOut ?? false;
  const todayRecord = todayStatus?.attendance;

  return (
    <AppShell title="Attendance">
      <div className="space-y-6">

        {/* ── My Attendance Panel ── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-base font-semibold text-gray-800">My Attendance — Today</h3>
          </div>

          {todayLoading ? (
            <div className="p-8 flex justify-center"><Spinner className="h-6 w-6" /></div>
          ) : (
            <div className="p-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

              {/* Left: status + action */}
              <div className="space-y-4">

                {/* Today info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-gray-50 px-4 py-3">
                    <p className="text-xs text-gray-400 mb-1">Check-in</p>
                    <p className="font-medium text-gray-800">
                      {todayRecord?.checkinTime ? formatDateTime(todayRecord.checkinTime) : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-4 py-3">
                    <p className="text-xs text-gray-400 mb-1">Check-out</p>
                    <p className="font-medium text-gray-800">
                      {todayRecord?.checkoutTime ? formatDateTime(todayRecord.checkoutTime) : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-4 py-3">
                    <p className="text-xs text-gray-400 mb-1">Working Hours</p>
                    <p className="font-medium text-gray-800">
                      {todayRecord?.workingHours ? formatHours(todayRecord.workingHours) : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-4 py-3">
                    <p className="text-xs text-gray-400 mb-1">Shift</p>
                    <p className="font-medium text-gray-800 truncate">
                      {todayRecord?.shift
                        ? `${todayRecord.shift.name} (${todayRecord.shift.startTime}–${todayRecord.shift.endTime})`
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* WFM status badges */}
                {todayRecord && <WfmBadges record={todayRecord} />}

                {/* Action feedback */}
                {actionMsg && (
                  <Alert
                    variant={actionMsg.type === 'success' ? 'success' : 'error'}
                    message={actionMsg.text}
                  />
                )}

                {/* Check-in / Check-out button */}
                {!checkedIn ? (
                  <Button
                    className="w-full"
                    size="lg"
                    loading={actionLoading}
                    onClick={handleCheckIn}
                  >
                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Check In
                  </Button>
                ) : !checkedOut ? (
                  <Button
                    className="w-full"
                    size="lg"
                    variant="secondary"
                    loading={actionLoading}
                    onClick={handleCheckOut}
                  >
                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Check Out
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Attendance complete for today
                  </div>
                )}
              </div>

              {/* Right: GPS panel */}
              <GpsPanel
                locations={locations}
                lat={geo.lat}
                lng={geo.lng}
                accuracy={geo.accuracy}
                geoError={geo.error}
                geoLoading={geo.loading}
              />
            </div>
          )}
        </div>

        {/* ── My History ── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-base font-semibold text-gray-800">My Attendance History</h3>
          </div>

          {myLoading ? (
            <PageSpinner />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-6 py-3 text-left">Date</th>
                      <th className="px-6 py-3 text-left">Shift</th>
                      <th className="px-6 py-3 text-left">Check-in</th>
                      <th className="px-6 py-3 text-left">Check-out</th>
                      <th className="px-6 py-3 text-left">Hours</th>
                      <th className="px-6 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myRecords?.data.map((rec) => (
                      <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-gray-700">{formatDate(rec.date)}</td>
                        <td className="px-6 py-3 text-gray-500 text-xs">
                          {rec.shift ? `${rec.shift.name}` : '—'}
                          {rec.shift && (
                            <span className="block text-gray-400">
                              {rec.shift.startTime}–{rec.shift.endTime}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-gray-600">{formatDateTime(rec.checkinTime)}</td>
                        <td className="px-6 py-3 text-gray-600">{formatDateTime(rec.checkoutTime)}</td>
                        <td className="px-6 py-3 font-medium text-indigo-600">{formatHours(rec.workingHours)}</td>
                        <td className="px-6 py-3"><WfmBadges record={rec} /></td>
                      </tr>
                    ))}
                    {myRecords?.data.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                          No attendance records yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {myRecords && myRecords.meta.totalPages > 1 && (
                <Pagination
                  page={myPage}
                  totalPages={myRecords.meta.totalPages}
                  total={myRecords.meta.total}
                  limit={myLimit}
                  onPrev={myPrev}
                  onNext={myNext}
                />
              )}
            </>
          )}
        </div>

        {/* ── Admin / HR / Manager Report ── */}
        {isManager && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-800">Attendance Report</h3>
            </div>

            {/* Filters */}
            <div className="border-b border-gray-100 p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // Apply the filter and restart from page 1.
                  setActiveFilter({ dateFrom, dateTo });
                  reset();
                }}
                className="flex flex-wrap items-end gap-3"
              >
                <Input label="From Date" type="date" value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)} />
                <Input label="To Date" type="date" value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)} />
                <Button type="submit" variant="secondary">Filter</Button>
                <Button type="button" variant="ghost"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setActiveFilter({ dateFrom: '', dateTo: '' });
                    reset();
                  }}>
                  Clear
                </Button>
              </form>
            </div>

            {/* Summary */}
            {report?.summary && (
              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 p-4">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{report.summary.totalRecords}</p>
                  <p className="text-sm text-gray-500">Total Records</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{Number(report.summary.totalWorkingHours).toFixed(1)}</p>
                  <p className="text-sm text-gray-500">Total Working Hours</p>
                </div>
              </div>
            )}

            {reportLoading ? (
              <PageSpinner />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-6 py-3 text-left">Employee</th>
                        <th className="px-6 py-3 text-left">Date</th>
                        <th className="px-6 py-3 text-left">Shift</th>
                        <th className="px-6 py-3 text-left">Check-in</th>
                        <th className="px-6 py-3 text-left">Check-out</th>
                        <th className="px-6 py-3 text-left">Hours</th>
                        <th className="px-6 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {report?.data.map((rec) => (
                        <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3">
                            <p className="font-medium text-gray-900">{rec.employee?.fullName ?? `#${rec.employeeId}`}</p>
                            <p className="text-xs text-gray-400">{rec.employee?.code}</p>
                          </td>
                          <td className="px-6 py-3 text-gray-600">{formatDate(rec.date)}</td>
                          <td className="px-6 py-3 text-gray-500 text-xs">
                            {rec.shift?.name ?? '—'}
                          </td>
                          <td className="px-6 py-3 text-gray-600">{formatDateTime(rec.checkinTime)}</td>
                          <td className="px-6 py-3 text-gray-600">{formatDateTime(rec.checkoutTime)}</td>
                          <td className="px-6 py-3 font-medium text-indigo-600">{formatHours(rec.workingHours)}</td>
                          <td className="px-6 py-3"><WfmBadges record={rec} /></td>
                        </tr>
                      ))}
                      {report?.data.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                            No records found for the selected period
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {report && report.meta.totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={report.meta.totalPages}
                    total={report.meta.total}
                    limit={limit}
                    onPrev={prev}
                    onNext={next}
                  />
                )}
              </>
            )}
          </div>
        )}

      </div>
    </AppShell>
  );
}
