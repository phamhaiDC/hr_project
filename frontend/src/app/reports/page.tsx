'use client';

import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';

const REPORTS = [
  {
    title: 'Attendance Report',
    description: 'View check-in/out times, working hours, and status for employees.',
    href: '/reports/attendance',
    icon: (
      <svg className="h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function ReportsPage() {
  return (
    <AppShell title="Reports">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {REPORTS.map((report) => (
          <Link
            key={report.href}
            href={report.href}
            className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100/50"
          >
            <div className="mb-4 rounded-xl bg-indigo-50 p-3 w-fit group-hover:scale-110 transition-transform">
              {report.icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {report.title}
            </h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              {report.description}
            </p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
