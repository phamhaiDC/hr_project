'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface RejectModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (comments: string) => Promise<void>;
  employeeName?: string;
}

export function RejectModal({ open, onClose, onConfirm, employeeName }: RejectModalProps) {
  const { t } = useTranslation();
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
      title={t('leave.rejectTitle')}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" form="reject-form" type="submit" loading={loading}>
            {t('leave.confirmReject')}
          </Button>
        </>
      }
    >
      <form id="reject-form" onSubmit={handleSubmit} className="space-y-4">
        {employeeName && (
          <p className="text-sm text-gray-600">
            {t('leave.rejectDescription', { name: '' })}
            <span className="font-medium text-gray-900">{employeeName}</span>.
          </p>
        )}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {t('leave.rejectReason')}
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            placeholder={t('leave.rejectReasonPlaceholder')}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
