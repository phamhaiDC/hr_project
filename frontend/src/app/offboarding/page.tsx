'use client';

import { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Pagination } from '@/components/ui/Pagination';
import { PageSpinner } from '@/components/ui/Spinner';
import { statusBadge } from '@/components/ui/Badge';
import { offboardingService } from '@/services/offboarding.service';
import { usePagination } from '@/hooks/usePagination';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/format';
import type { ResignationRequest, PaginatedResponse } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
  const raw = e?.response?.data?.message;
  if (raw) return Array.isArray(raw) ? raw[0] : raw;
  return e?.message ?? fallback;
}

// ─── Submit resignation modal ─────────────────────────────────────────────────

interface SubmitModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function SubmitResignationModal({ open, onClose, onSuccess }: SubmitModalProps) {
  const [lastWorkingDate, setLastWorkingDate] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleClose() {
    setLastWorkingDate('');
    setReason('');
    setError('');
    onClose();
  }

  async function handleSubmit() {
    if (!lastWorkingDate) { setError('Last working date is required.'); return; }
    if (!reason.trim()) { setError('Reason is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await offboardingService.submit({ lastWorkingDate, reason: reason.trim() });
      handleClose();
      onSuccess();
    } catch (err) {
      setError(extractError(err, 'Failed to submit resignation.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Submit Resignation"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={handleClose}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleSubmit}>Submit</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert variant="error" message={error} />}
        <Input
          label="Last Working Date *"
          type="date"
          value={lastWorkingDate}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setLastWorkingDate(e.target.value)}
        />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Please explain your reason for resigning..."
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}

// ─── Reject modal ─────────────────────────────────────────────────────────────

interface RejectModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (comments: string) => void;
  employeeName?: string;
}

function RejectModal({ open, onClose, onConfirm, employeeName }: RejectModalProps) {
  const [comments, setComments] = useState('');

  function handleClose() { setComments(''); onClose(); }
  function handleConfirm() { onConfirm(comments); handleClose(); }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Reject Resignation${employeeName ? ` — ${employeeName}` : ''}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={handleClose}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={handleConfirm}>Confirm Reject</Button>
        </>
      }
    >
      <Input
        label="Reason (optional)"
        placeholder="Why is this resignation being rejected?"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
      />
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OffboardingPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<PaginatedResponse<ResignationRequest> | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [actionError, setActionError] = useState('');
  const [acting, setActing] = useState<number | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ResignationRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const { page, limit, next, prev, reset } = usePagination(20);

  const isApprover = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';
  const isEmployee = user?.role === 'employee';

  const load = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      if (isEmployee) {
        // Employees see only their own
        const myList = await offboardingService.listMy();
        setResult({
          data: myList,
          meta: { total: myList.length, page: 1, limit: myList.length, totalPages: 1 },
        });
      } else {
        const data = await offboardingService.listAll({
          page,
          limit,
          status: statusFilter || undefined,
        });
        setResult(data);
      }
    } catch (err) {
      setPageError(extractError(err, 'Failed to load resignation requests.'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, isEmployee]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(id: number) {
    setActing(id);
    setActionError('');
    try {
      await offboardingService.approve(id);
      await load();
    } catch (err) {
      setActionError(extractError(err, 'Approval failed.'));
    } finally {
      setActing(null);
    }
  }

  async function handleReject(comments: string) {
    if (!rejectTarget) return;
    setActing(rejectTarget.id);
    setActionError('');
    try {
      await offboardingService.reject(rejectTarget.id, comments || undefined);
      setRejectTarget(null);
      await load();
    } catch (err) {
      setActionError(extractError(err, 'Rejection failed.'));
    } finally {
      setActing(null);
    }
  }

  return (
    <AppShell title="Offboarding">
      <div className="space-y-5">
        {pageError && <Alert variant="error" message={pageError} />}
        {actionError && <Alert variant="error" message={actionError} />}

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-gray-800">
                Resignation Requests
                {result && (
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    ({result.meta.total} total)
                  </span>
                )}
              </h3>
              {!isEmployee && (
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); reset(); }}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              )}
            </div>
            <Button size="sm" onClick={() => setShowSubmit(true)}>
              + Submit Resignation
            </Button>
          </div>

          {loading ? (
            <PageSpinner />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <tr>
                      {!isEmployee && <th className="px-6 py-3 text-left">Employee</th>}
                      <th className="px-6 py-3 text-left">Last Working Date</th>
                      <th className="px-6 py-3 text-left">Reason</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Step</th>
                      <th className="px-6 py-3 text-left">Submitted</th>
                      {isApprover && <th className="px-6 py-3 text-left">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {result?.data.map((res) => (
                      <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                        {!isEmployee && (
                          <td className="px-6 py-3">
                            <p className="font-medium text-gray-900">{res.employee?.fullName ?? `#${res.employeeId}`}</p>
                            <p className="text-xs text-gray-400">{res.employee?.department?.name}</p>
                          </td>
                        )}
                        <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{formatDate(res.lastWorkingDate)}</td>
                        <td className="px-6 py-3 max-w-[200px]">
                          <p className="truncate text-gray-600">{res.reason}</p>
                        </td>
                        <td className="px-6 py-3">{statusBadge(res.status)}</td>
                        <td className="px-6 py-3 text-gray-500 text-xs">{res.currentStep}/2</td>
                        <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{formatDate(res.createdAt)}</td>
                        {isApprover && (
                          <td className="px-6 py-3">
                            {res.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  loading={acting === res.id}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                                  onClick={() => handleApprove(res.id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  disabled={acting === res.id}
                                  onClick={() => setRejectTarget(res)}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {result?.data.length === 0 && (
                      <tr>
                        <td
                          colSpan={isApprover && !isEmployee ? 7 : isEmployee ? 5 : 6}
                          className="px-6 py-12 text-center text-sm text-gray-400"
                        >
                          No resignation requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {result && result.meta.totalPages > 1 && !isEmployee && (
                <Pagination
                  page={page}
                  totalPages={result.meta.totalPages}
                  total={result.meta.total}
                  limit={limit}
                  onPrev={prev}
                  onNext={next}
                />
              )}
            </>
          )}
        </div>
      </div>

      <SubmitResignationModal
        open={showSubmit}
        onClose={() => setShowSubmit(false)}
        onSuccess={load}
      />

      <RejectModal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        employeeName={rejectTarget?.employee?.fullName}
      />
    </AppShell>
  );
}
