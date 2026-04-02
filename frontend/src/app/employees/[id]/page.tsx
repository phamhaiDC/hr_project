'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { PageSpinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { employeeService } from '@/services/employee.service';
import { EmployeeProfile } from '@/modules/employee/EmployeeProfile';
import { EmployeeHistory } from '@/modules/employee/EmployeeHistory';
import type { Employee } from '@/types';

interface HistoryRecord {
  id: number;
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
  changedBy?: number | null;
  effectiveDate?: string | null;
  createdAt?: string;
}

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'history', label: 'Change History' },
];

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const emp = await employeeService.get(Number(id));
        setEmployee(emp);
      } catch {
        setError('Failed to load employee.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (activeTab !== 'history' || !id) return;
    setHistoryLoading(true);
    employeeService
      .history(Number(id))
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [activeTab, id]);

  if (loading) return <AppShell title="Employee"><PageSpinner /></AppShell>;

  if (error || !employee) {
    return (
      <AppShell title="Employee">
        <Alert message={error || 'Employee not found.'} />
        <Button variant="secondary" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </AppShell>
    );
  }

  return (
    <AppShell title={employee.fullName ?? 'Employee'}>
      <div className="space-y-5">
        {/* Back navigation */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Employees
        </button>

        {/* Tabs */}
        <Tabs
          tabs={TABS}
          active={activeTab}
          onChange={setActiveTab}
        />

        {/* Tab content */}
        {activeTab === 'profile' && <EmployeeProfile employee={employee} />}
        {activeTab === 'history' && (
          <EmployeeHistory records={history} loading={historyLoading} />
        )}
      </div>
    </AppShell>
  );
}
