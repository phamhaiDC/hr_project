'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { employeeService, type CreateEmployeePayload } from '@/services/employee.service';
import { organizationService } from '@/services/organization.service';
import type { Branch, Department, Position, Employee } from '@/types';

interface CreateEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (employee: Employee) => void;
}

interface FormState {
  code: string;
  fullName: string;
  email: string;
  password: string;
  phone: string;
  branchId: string;
  departmentId: string;
  positionId: string;
  managerId: string;
  role: string;
  status: string;
}

const INITIAL: FormState = {
  code: '',
  fullName: '',
  email: '',
  password: '',
  phone: '',
  branchId: '',
  departmentId: '',
  positionId: '',
  managerId: '',
  role: 'employee',
  status: 'probation',
};

function toOptions<T extends { id: number; name?: string | null }>(
  items: T[],
): SelectOption[] {
  return items.map((i) => ({ value: i.id, label: i.name ?? String(i.id) }));
}

export function CreateEmployeeModal({
  open,
  onClose,
  onSuccess,
}: CreateEmployeeModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reference data
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  // Load reference data when modal opens
  useEffect(() => {
    if (!open) return;
    setForm(INITIAL);
    setErrors({});
    setApiError('');

    async function fetchRefs() {
      setLoadingRefs(true);
      try {
        const [b, d, p, m] = await Promise.all([
          organizationService.branches(),
          organizationService.departments(),
          organizationService.positions(),
          employeeService.list({ limit: 100, role: 'manager' }).then((r) => r.data),
        ]);
        setBranches(b);
        setDepartments(d);
        setPositions(p);
        setManagers(m);
      } finally {
        setLoadingRefs(false);
      }
    }

    fetchRefs();
  }, [open]);

  // Re-fetch departments when branch changes
  useEffect(() => {
    if (!form.branchId) return;
    organizationService
      .departments(Number(form.branchId))
      .then(setDepartments);
    setForm((f) => ({ ...f, departmentId: '', positionId: '' }));
  }, [form.branchId]);

  // Re-fetch positions when department changes
  useEffect(() => {
    if (!form.departmentId) return;
    organizationService
      .positions(Number(form.departmentId))
      .then(setPositions);
    setForm((f) => ({ ...f, positionId: '' }));
  }, [form.departmentId]);

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  }

  function validate(): boolean {
    const errs: Partial<FormState> = {};
    if (!form.code.trim()) errs.code = 'Employee code is required';
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!form.branchId) errs.branchId = 'Branch is required';
    if (!form.departmentId) errs.departmentId = 'Department is required';
    if (!form.positionId) errs.positionId = 'Position is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setApiError('');
    setLoading(true);
    try {
      const payload: CreateEmployeePayload = {
        code: form.code,
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        branchId: Number(form.branchId),
        departmentId: Number(form.departmentId),
        positionId: Number(form.positionId),
        managerId: form.managerId ? Number(form.managerId) : undefined,
        role: form.role,
        status: form.status,
      };
      const created = await employeeService.create(payload);
      onSuccess(created);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      setApiError(
        Array.isArray(msg) ? msg[0] : (msg ?? 'Failed to create employee'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add New Employee"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button form="create-employee-form" type="submit" loading={loading}>
            Create Employee
          </Button>
        </>
      }
    >
      {loadingRefs ? (
        <div className="flex items-center justify-center py-10 text-sm text-gray-400">
          Loading reference data…
        </div>
      ) : (
        <form id="create-employee-form" onSubmit={handleSubmit} className="space-y-5">
          {apiError && <Alert message={apiError} />}

          {/* Identity */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Identity
            </legend>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Employee Code *"
                placeholder="EMP001"
                value={form.code}
                onChange={(e) => set('code', e.target.value)}
                error={errors.code}
              />
              <Input
                label="Full Name *"
                placeholder="Nguyen Van A"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                error={errors.fullName}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email *"
                type="email"
                placeholder="nguyen.vana@company.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                error={errors.email}
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="0912 345 678"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </div>
            <Input
              label="Password *"
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              error={errors.password}
            />
          </fieldset>

          <hr className="border-gray-100" />

          {/* Organization */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Organization
            </legend>
            <Select
              label="Branch *"
              placeholder="Select branch…"
              value={form.branchId}
              options={toOptions(branches)}
              onChange={(e) => set('branchId', e.target.value)}
              error={errors.branchId}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Department *"
                placeholder="Select department…"
                value={form.departmentId}
                options={toOptions(departments)}
                onChange={(e) => set('departmentId', e.target.value)}
                error={errors.departmentId}
                disabled={!form.branchId}
              />
              <Select
                label="Position *"
                placeholder="Select position…"
                value={form.positionId}
                options={toOptions(positions)}
                onChange={(e) => set('positionId', e.target.value)}
                error={errors.positionId}
                disabled={!form.departmentId}
              />
            </div>
            <Select
              label="Direct Manager"
              placeholder="Select manager (optional)…"
              value={form.managerId}
              options={managers.map((m) => ({
                value: m.id,
                label: `${m.fullName} (${m.code ?? m.email})`,
              }))}
              onChange={(e) => set('managerId', e.target.value)}
            />
          </fieldset>

          <hr className="border-gray-100" />

          {/* Role & Status */}
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Role & Status
            </legend>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Role"
                value={form.role}
                options={[
                  { value: 'employee', label: 'Employee' },
                  { value: 'manager', label: 'Manager' },
                  { value: 'hr', label: 'HR' },
                  { value: 'admin', label: 'Admin' },
                ]}
                onChange={(e) => set('role', e.target.value)}
              />
              <Select
                label="Status"
                value={form.status}
                options={[
                  { value: 'probation', label: 'Probation' },
                  { value: 'official', label: 'Official' },
                ]}
                onChange={(e) => set('status', e.target.value)}
              />
            </div>
          </fieldset>
        </form>
      )}
    </Modal>
  );
}
