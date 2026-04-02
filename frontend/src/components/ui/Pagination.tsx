'use client';

import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo?: (page: number) => void;
  total: number;
  limit: number;
}

export function Pagination({ page, totalPages, onPrev, onNext, total, limit }: PaginationProps) {
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium">{from}</span>–
        <span className="font-medium">{to}</span> of{' '}
        <span className="font-medium">{total}</span> results
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onPrev} disabled={page <= 1}>
          Previous
        </Button>
        <span className="flex items-center px-3 text-sm text-gray-600">
          {page} / {totalPages}
        </span>
        <Button variant="secondary" size="sm" onClick={onNext} disabled={page >= totalPages}>
          Next
        </Button>
      </div>
    </div>
  );
}
