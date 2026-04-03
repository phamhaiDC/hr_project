'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { employeeService } from '@/services/employee.service';

// ─── Admin mode: reset any employee's password (no current-password needed) ──
// ─── Self mode:  employee changes own password (requires current password) ────

interface AdminModeProps {
  mode: 'admin';
  employeeId: number;
  employeeName?: string;
}

interface SelfModeProps {
  mode: 'self';
}

type ChangePasswordModalProps = (AdminModeProps | SelfModeProps) & {
  open: boolean;
  onClose: () => void;
};

export function ChangePasswordModal(props: ChangePasswordModalProps) {
  const { open, onClose } = props;
  const isAdmin = props.mode === 'admin';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});
  const [apiError, setApiError]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [success, setSuccess]     = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    setApiError('');
    setSuccess(false);
  }, [open]);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!isAdmin && !currentPassword) errs.current = 'Current password is required';
    if (!newPassword) {
      errs.new = 'New password is required';
    } else if (newPassword.length < 8) {
      errs.new = 'Password must be at least 8 characters';
    }
    if (!confirmPassword) {
      errs.confirm = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errs.confirm = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setApiError('');
    try {
      if (isAdmin) {
        await employeeService.updatePassword((props as AdminModeProps).employeeId, newPassword);
      } else {
        await employeeService.updateMyPassword(currentPassword, newPassword);
      }
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      setApiError(Array.isArray(msg) ? msg[0] : (msg ?? 'Failed to change password'));
    } finally {
      setSaving(false);
    }
  }

  const title = isAdmin
    ? `Reset Password — ${(props as AdminModeProps).employeeName ?? 'Employee'}`
    : 'Change My Password';

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {success ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-800">Password changed successfully</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {apiError && <Alert variant="error" message={apiError} />}

          {!isAdmin && (
            <Input
              label="Current Password *"
              type="password"
              placeholder="Your current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              error={errors.current}
            />
          )}

          <Input
            label="New Password *"
            type="password"
            placeholder="Min. 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={errors.new}
          />

          <Input
            label="Confirm New Password *"
            type="password"
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirm}
          />

          {isAdmin && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              You are resetting this employee's password. They will need to use the new password on their next login.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {isAdmin ? 'Reset Password' : 'Change Password'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
