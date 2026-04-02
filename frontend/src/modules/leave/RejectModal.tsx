'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface RejectModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (comments: string) => Promise<void>;
  employeeName?: string;
}

export function RejectModal({ open, onClose, onConfirm, employeeName }: RejectModalProps) {
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(comments);
      setComments('');
      onClose();
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setComments('');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Reject Leave Request"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" form="reject-form" type="submit" loading={loading}>
            Confirm Reject
          </Button>
        </>
      }
    >
      <form id="reject-form" onSubmit={handleSubmit} className="space-y-4">
        {employeeName && (
          <p className="text-sm text-gray-600">
            Rejecting leave request from <span className="font-medium text-gray-900">{employeeName}</span>.
          </p>
        )}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Reason for rejection <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            placeholder="Provide a reason so the employee understands..."
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
