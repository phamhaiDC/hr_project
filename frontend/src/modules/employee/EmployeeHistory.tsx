import { Table, type Column } from '@/components/ui/Table';
import { formatDate } from '@/utils/format';

interface HistoryRecord {
  id: number;
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
  changedBy?: number | null;
  effectiveDate?: string | null;
  createdAt?: string;
}

const FIELD_LABELS: Record<string, string> = {
  departmentId: 'Department',
  positionId: 'Position',
  managerId: 'Manager',
  status: 'Status',
  role: 'Role',
};

const COLUMNS: Column<HistoryRecord>[] = [
  {
    key: 'field',
    header: 'Field Changed',
    render: (r) => (
      <span className="font-medium text-gray-800">
        {FIELD_LABELS[r.field] ?? r.field}
      </span>
    ),
  },
  {
    key: 'oldValue',
    header: 'Previous Value',
    render: (r) => (
      <span className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-600 font-mono">
        {r.oldValue ?? '—'}
      </span>
    ),
  },
  {
    key: 'arrow',
    header: '',
    render: () => <span className="text-gray-300">→</span>,
    headerClassName: 'w-4',
    cellClassName: 'w-4',
  },
  {
    key: 'newValue',
    header: 'New Value',
    render: (r) => (
      <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 font-mono">
        {r.newValue ?? '—'}
      </span>
    ),
  },
  {
    key: 'effectiveDate',
    header: 'Effective Date',
    render: (r) => (
      <span className="text-gray-500">{formatDate(r.effectiveDate ?? r.createdAt)}</span>
    ),
  },
];

interface EmployeeHistoryProps {
  records: HistoryRecord[];
  loading?: boolean;
}

export function EmployeeHistory({ records, loading }: EmployeeHistoryProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h3 className="text-sm font-semibold text-gray-700">Change History</h3>
        <p className="mt-0.5 text-xs text-gray-400">
          Tracks changes to department, position, manager, status and role.
        </p>
      </div>
      <Table<HistoryRecord>
        columns={COLUMNS}
        data={records}
        loading={loading}
        keyExtractor={(r) => r.id}
        emptyMessage="No change history yet."
      />
    </div>
  );
}
