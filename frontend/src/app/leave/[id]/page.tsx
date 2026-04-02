'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { statusBadge } from '@/components/ui/Badge';
import { leaveService } from '@/services/leave.service';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatDateTime, capitalise } from '@/utils/format';
import { LeaveTimeline } from '@/modules/leave/LeaveTimeline';
import { RejectModal } from '@/modules/leave/RejectModal';
import type { LeaveRequest } from '@/types';

export default function LeaveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [leave, setLeave] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReject, setShowReject] = useState(false);

  const isApprover =
    user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';
  const canAct = isApprover && leave?.status === 'pending';
  const isOwner = leave?.employeeId === user?.id;
  const canCancel = isOwner && (leave?.status === 'pending' || leave?.status === 'approved');

  function extractApiError(err: unknown, fallback: string): string {
    const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
    const raw = e?.response?.data?.message;
    if (raw) return Array.isArray(raw) ? raw[0] : raw;
    return e?.message ?? fallback;
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await leaveService.get(Number(id));
      setLeave(data);
    } catch (err) {
      setError(extractApiError(err, 'Failed to load leave request.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleApprove() {
    if (!leave) return;
    setActionLoading(true);
    setError('');
    try {
      await leaveService.approve(leave.id);
      await load();
    } catch (err) {
      setError(extractApiError(err, 'Approval failed. Please try again.'));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(comments: string) {
    if (!leave) return;
    setError('');
    try {
      await leaveService.reject(leave.id, comments || undefined);
      await load();
    } catch (err) {
      setError(extractApiError(err, 'Rejection failed. Please try again.'));
    }
  }

  async function handleCancel() {
    if (!leave) return;
    setActionLoading(true);
    setError('');
    try {
      await leaveService.cancel(leave.id);
      await load();
    } catch (err) {
      setError(extractApiError(err, 'Cancel failed. Please try again.'));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <AppShell title="Leave Request"><PageSpinner /></AppShell>;

  if (!leave && error) {
    return (
      <AppShell title="Leave Request">
        <div className="p-6 space-y-4">
          <Alert message={error} />
          <Button variant="secondary" onClick={() => router.back()}>Go Back</Button>
        </div>
      </AppShell>
    );
  }

  if (!leave) return null;

  return (
    <AppShell title="Leave Request Detail">
      <div className="space-y-5 max-w-3xl">
        {error && <Alert message={error} />}

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Leave
        </button>

        {/* Header card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-gray-900">
                  Leave Request #{leave.id}
                </h2>
                {statusBadge(leave.status)}
                {statusBadge(leave.type)}
              </div>
              <p className="text-sm text-gray-500">
                Submitted on {formatDateTime(leave.createdAt)}
              </p>
            </div>

            {/* Action buttons */}
            {(canAct || canCancel) && (
              <div className="flex gap-2">
                {canAct && (
                  <>
                    <Button
                      onClick={handleApprove}
                      loading={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setShowReject(true)}
                      disabled={actionLoading}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {canCancel && (
                  <Button
                    variant="secondary"
                    onClick={handleCancel}
                    loading={actionLoading}
                  >
                    Cancel Request
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Request info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Request Details
            </h3>
            <dl className="space-y-3">
              <Row label="Leave Type" value={capitalise(leave.type)} />
              <Row label="From" value={formatDate(leave.fromDate)} />
              <Row label="To" value={formatDate(leave.toDate)} />
              <Row
                label="Duration"
                value={`${leave.days} day${leave.days !== 1 ? 's' : ''}`}
              />
              <Row label="Status" value={statusBadge(leave.status)} />
              <Row label="Current Step" value={`${leave.currentStep} / 2`} />
            </dl>
          </div>

          {/* Employee info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Employee
            </h3>
            {leave.employee ? (
              <dl className="space-y-3">
                <Row label="Name" value={leave.employee.fullName} />
                <Row label="Email" value={leave.employee.email} />
                <Row label="Code" value={
                  <span className="font-mono">{leave.employee.code}</span>
                } />
                <Row
                  label="Department"
                  value={leave.employee.department?.name}
                />
                <Row
                  label="Manager"
                  value={leave.employee.manager?.fullName}
                />
              </dl>
            ) : (
              <p className="text-sm text-gray-400">Employee #${leave.employeeId}</p>
            )}
          </div>
        </div>

        {/* Reason */}
        {leave.reason && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Reason
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">{leave.reason}</p>
          </div>
        )}

        {/* Approval timeline */}
        <LeaveTimeline
          approvals={leave.approvals}
          currentStep={leave.currentStep}
        />
      </div>

      <RejectModal
        open={showReject}
        onClose={() => setShowReject(false)}
        onConfirm={handleReject}
        employeeName={leave.employee?.fullName}
      />
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400 shrink-0">
        {label}
      </dt>
      <dd className="text-sm text-gray-800 text-right">{value ?? '—'}</dd>
    </div>
  );
}
