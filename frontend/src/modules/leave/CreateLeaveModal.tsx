'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { useTranslation } from 'react-i18next';
import { leaveService } from '@/services/leave.service';
import type { LeaveBalance } from '@/types';

interface CreateLeaveModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  leaveType: 'annual' | 'sick' | 'unpaid';
  fromDate: string;
  toDate: string;
  reason: string;
}

const INITIAL: FormState = {
  leaveType: 'annual',
  fromDate: '',
  toDate: '',
  reason: '',
};

// Options built inside component to support translations (see below)

/** Count business days (Mon–Fri) between two date strings, inclusive. */
function countBusinessDays(from: string, to: string): number {
  if (!from || !to || to < from) return 0;
  let count = 0;
  const cursor = new Date(from);
  const end = new Date(to);
  while (cursor <= end) {
    const d = cursor.getDay();
    if (d !== 0 && d !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function CreateLeaveModal({ open, onClose, onSuccess }: CreateLeaveModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);

  const LEAVE_TYPE_OPTIONS = [
    { value: 'annual', label: t('leave.annual') },
    { value: 'sick',   label: t('leave.sick') },
    { value: 'unpaid', label: t('leave.unpaid') },
  ];

  useEffect(() => {
    if (!open) return;
    leaveService.balance().then((d) => setBalance(d.balance)).catch(() => {});
  }, [open]);

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.fromDate) errs.fromDate = t('validation.fromDateRequired');
    if (!form.toDate) errs.toDate = t('validation.toDateRequired');
    else if (form.fromDate && form.toDate < form.fromDate)
      errs.toDate = t('validation.toDateAfterFrom');
    if (!form.reason.trim()) errs.reason = t('validation.reasonRequired');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setApiError('');
    setLoading(true);
    try {
      await leaveService.create(form);
      setForm(INITIAL);
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      setApiError(Array.isArray(msg) ? msg[0] : (msg ?? t('leave.failedToSubmit')));
    } finally {
      setLoading(false);
    }
  }

  const requestedDays = countBusinessDays(form.fromDate, form.toDate);
  const remaining = balance ? Number(balance.remaining) : null;
  const willExceed =
    form.leaveType !== 'unpaid' &&
    remaining !== null &&
    requestedDays > 0 &&
    requestedDays > remaining;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('leave.newRequest')}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button form="create-leave-form" type="submit" loading={loading} disabled={willExceed}>
            {t('leave.submitRequest')}
          </Button>
        </>
      }
    >
      <form id="create-leave-form" onSubmit={handleSubmit} className="space-y-4">
        {apiError && <Alert message={apiError} />}

        {/* Balance hint */}
        {balance && (
          <div className={[
            'rounded-lg px-4 py-3 text-sm',
            willExceed
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-indigo-50 border border-indigo-100 text-indigo-700',
          ].join(' ')}>
            <span className="font-medium">{t('leave.balanceHint')}</span>{' '}
            <span className="font-bold">{Number(balance.remaining)}</span>{' '}
            {t('leave.balanceDaysRemaining', { total: Number(balance.total) })}
            {requestedDays > 0 && form.leaveType !== 'unpaid' && (
              <>
                {' '}— {t('leave.requesting', { n: requestedDays })}
                {willExceed && ` ${t('leave.exceedsBalance')}`}
              </>
            )}
          </div>
        )}

        <Select
          label={t('leave.leaveType')}
          value={form.leaveType}
          options={LEAVE_TYPE_OPTIONS}
          onChange={(e) => set('leaveType', e.target.value as FormState['leaveType'])}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('leave.fromDate')}
            type="date"
            value={form.fromDate}
            onChange={(e) => set('fromDate', e.target.value)}
            error={errors.fromDate}
          />
          <Input
            label={t('leave.toDate')}
            type="date"
            value={form.toDate}
            min={form.fromDate}
            onChange={(e) => set('toDate', e.target.value)}
            error={errors.toDate}
          />
        </div>

        {requestedDays > 0 && (
          <p className="text-xs text-gray-500">
            {t('common.daysSelected', { n: requestedDays })}
          </p>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {t('leave.reason')} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.reason}
            onChange={(e) => set('reason', e.target.value)}
            rows={3}
            placeholder={t('leave.reasonPlaceholder')}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
          {errors.reason && <p className="text-xs text-red-500">{errors.reason}</p>}
        </div>
      </form>
    </Modal>
  );
}
