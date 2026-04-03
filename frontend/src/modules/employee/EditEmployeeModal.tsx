'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { employeeService } from '@/services/employee.service';
import { capitalise } from '@/utils/format';
import type { Employee } from '@/types';

interface EditEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee;
  onSuccess: (updated: Employee) => void;
}

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  status: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

export function EditEmployeeModal({ open, onClose, employee, onSuccess }: EditEmployeeModalProps) {
  const [form, setForm]       = useState<FormState>({ fullName: '', email: '', phone: '', status: '' });
  const [errors, setErrors]   = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      fullName: employee.fullName ?? '',
      email:    employee.email   ?? '',
      phone:    employee.phone   ?? '',
      status:   employee.status  ?? 'probation',
    });
    setErrors({});
    setApiError('');
  }, [open, employee]);

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.fullName.trim()) errs.fullName = 'Name is required';
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = 'Invalid email address';
    }
    if (form.phone && !/^[+\d\s\-().]{7,20}$/.test(form.phone)) {
      errs.phone = 'Invalid phone number';
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
      const updated = await employeeService.updateProfile(employee.id, {
        fullName: form.fullName.trim(),
        email:    form.email.trim(),
        phone:    form.phone.trim() || undefined,
        status:   form.status,
      });
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      setApiError(Array.isArray(msg) ? msg[0] : (msg ?? 'Failed to update employee'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Employee" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && <Alert variant="error" message={apiError} />}

        {/* Editable fields */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Editable
          </legend>
          <Input
            label="Full Name *"
            value={form.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            error={errors.fullName}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email *"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              error={errors.email}
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="Optional"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              error={errors.phone}
            />
          </div>
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            options={[
              { value: 'probation', label: 'Probation' },
              { value: 'official',  label: 'Official' },
              { value: 'resigned',  label: 'Resigned' },
            ]}
          />
        </fieldset>

        <hr className="border-gray-100" />

        {/* Read-only context */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Read-only
          </legend>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Code',       value: employee.code },
              { label: 'Role',       value: capitalise(employee.role ?? '') },
              { label: 'Department', value: employee.department?.name ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="mt-0.5 text-sm font-medium text-gray-500">{value}</p>
              </div>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
