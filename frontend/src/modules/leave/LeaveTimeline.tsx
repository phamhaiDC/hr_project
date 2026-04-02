import { statusBadge } from '@/components/ui/Badge';
import { formatDateTime } from '@/utils/format';
import type { LeaveApproval } from '@/types';

const STEP_META: Record<number, { role: string; label: string }> = {
  1: { role: 'manager', label: 'Manager Review' },
  2: { role: 'hr', label: 'HR Review' },
};

interface LeaveTimelineProps {
  approvals?: LeaveApproval[];
  currentStep: number;
}

export function LeaveTimeline({ approvals = [], currentStep }: LeaveTimelineProps) {
  const steps = [1, 2];

  function getApproval(step: number): LeaveApproval | undefined {
    return approvals.find((a) => a.step === step);
  }

  function stepStatus(step: number): 'approved' | 'rejected' | 'pending' | 'waiting' {
    const approval = getApproval(step);
    if (!approval) return step < currentStep ? 'pending' : 'waiting';
    if (approval.status === 'approved') return 'approved';
    if (approval.status === 'rejected') return 'rejected';
    if (step === currentStep) return 'pending';
    return 'waiting';
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h3 className="text-sm font-semibold text-gray-700">Approval Timeline</h3>
        <p className="mt-0.5 text-xs text-gray-400">Two-step approval: manager then HR</p>
      </div>

      <div className="px-6 py-5">
        <ol className="relative space-y-0">
          {steps.map((step, idx) => {
            const meta = STEP_META[step];
            const approval = getApproval(step);
            const status = stepStatus(step);
            const isLast = idx === steps.length - 1;

            return (
              <li key={step} className="relative flex gap-4">
                {/* Connector line */}
                {!isLast && (
                  <div className="absolute left-4 top-9 bottom-0 w-px bg-gray-200" />
                )}

                {/* Step dot */}
                <div className="relative z-10 flex-shrink-0">
                  <StepDot status={status} step={step} />
                </div>

                {/* Content */}
                <div className={`flex-1 pb-8 ${isLast ? 'pb-0' : ''}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      Step {step} — {meta.label}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">({meta.role})</span>
                    {statusBadge(status === 'waiting' ? 'pending' : status)}
                  </div>

                  {approval && approval.status !== 'pending' ? (
                    <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 space-y-1">
                      {approval.actionTime && (
                        <p className="text-xs text-gray-500">
                          {status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                          <span className="font-medium text-gray-700">
                            {formatDateTime(approval.actionTime)}
                          </span>
                        </p>
                      )}
                      {approval.comments && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Comment:</span> {approval.comments}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-gray-400">
                      {status === 'pending'
                        ? 'Awaiting action…'
                        : 'Not yet reached'}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function StepDot({ status, step }: { status: string; step: number }) {
  const base = 'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold';

  if (status === 'approved') {
    return (
      <div className={`${base} bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200`}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === 'rejected') {
    return (
      <div className={`${base} bg-red-100 text-red-600 ring-2 ring-red-200`}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }
  if (status === 'pending') {
    return (
      <div className={`${base} bg-amber-100 text-amber-700 ring-2 ring-amber-200`}>
        {step}
      </div>
    );
  }
  // waiting
  return (
    <div className={`${base} bg-gray-100 text-gray-400 ring-2 ring-gray-200`}>
      {step}
    </div>
  );
}
