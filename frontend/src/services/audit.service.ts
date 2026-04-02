import api from '@/lib/axios';

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  entity: string;
  entityId?: number | null;
  details?: Record<string, unknown> | null;
  timestamp: string;
  actor?: { id: number; fullName?: string | null; email?: string | null; code?: string | null };
}

export interface AuditListParams {
  page?: number;
  limit?: number;
  userId?: number;
  action?: string;
  entity?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  byAction: { action: string; count: number }[];
  byEntity: { entity: string; count: number }[];
}

export const auditService = {
  list: (params?: AuditListParams) =>
    api.get<{ data: AuditLog[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      '/audit/logs',
      { params },
    ).then((r) => r.data),

  stats: () =>
    api.get<AuditStats>('/audit/stats').then((r) => r.data),
};
