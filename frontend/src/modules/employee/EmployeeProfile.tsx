import { statusBadge } from '@/components/ui/Badge';
import { EmployeeAvatar } from './EmployeeAvatar';
import { formatDate, capitalise } from '@/utils/format';
import type { Employee } from '@/types';

interface FieldProps {
  label: string;
  value?: React.ReactNode;
}

function Field({ label, value }: FieldProps) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-800">{value ?? '—'}</dd>
    </div>
  );
}

interface EmployeeProfileProps {
  employee: Employee;
}

export function EmployeeProfile({ employee }: EmployeeProfileProps) {
  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <EmployeeAvatar name={employee.fullName ?? 'U'} size="xl" />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 truncate">{employee.fullName}</h2>
          <p className="text-sm text-gray-500">{employee.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {statusBadge(employee.status)}
            {statusBadge(employee.role ?? '')}
            {employee.department && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                {employee.department.name}
              </span>
            )}
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <p className="font-mono text-lg font-bold text-indigo-600">{employee.code}</p>
          <p className="text-xs text-gray-400">Employee Code</p>
        </div>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Personal info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Personal Information
          </h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Full Name" value={employee.fullName} />
            <Field label="Email" value={employee.email} />
            <Field label="Phone" value={employee.phone} />
            <Field label="Employee Code" value={
              <span className="font-mono">{employee.code}</span>
            } />
            <Field label="Join Date" value={formatDate(employee.joinDate)} />
            <Field label="Status" value={statusBadge(employee.status)} />
          </dl>
        </div>

        {/* Work info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Work Information
          </h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Department" value={employee.department?.name} />
            <Field label="Position" value={employee.position?.name} />
            <Field label="Branch" value={employee.branch?.name} />
            <Field label="Role" value={capitalise(employee.role ?? '')} />
            <Field
              label="Direct Manager"
              value={
                employee.manager ? (
                  <div>
                    <p className="font-medium">{employee.manager.fullName}</p>
                    <p className="text-xs text-gray-400">{employee.manager.email}</p>
                  </div>
                ) : undefined
              }
            />
          </dl>
        </div>
      </div>
    </div>
  );
}
