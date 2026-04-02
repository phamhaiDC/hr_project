import api from '@/lib/axios';
import type { ResignationRequest, PaginatedResponse } from '@/types';

export interface CreateResignationPayload {
  lastWorkingDate: string;
  reason: string;
}

export interface ResignationListParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface ChecklistItem {
  id: number;
  employeeId: number;
  title: string;
  completedAt?: string | null;
  completedBy?: number | null;
}

export const offboardingService = {
  // ── Resignation ──────────────────────────────────────────────────────────────

  submit: (payload: CreateResignationPayload) =>
    api.post<ResignationRequest>('/resignation', payload).then((r) => r.data),

  listMy: () =>
    api.get<ResignationRequest[]>('/resignation/my').then((r) => r.data),

  listAll: (params?: ResignationListParams) =>
    api.get<PaginatedResponse<ResignationRequest>>('/resignation', { params }).then((r) => r.data),

  get: (id: number) =>
    api.get<ResignationRequest>(`/resignation/${id}`).then((r) => r.data),

  approve: (id: number, comments?: string) =>
    api.post(`/resignation/${id}/approve`, { comments }).then((r) => r.data),

  reject: (id: number, comments?: string) =>
    api.post(`/resignation/${id}/reject`, { comments }).then((r) => r.data),

  // ── Checklist ────────────────────────────────────────────────────────────────

  getChecklist: (employeeId: number) =>
    api.get<ChecklistItem[]>(`/resignation/checklist/${employeeId}`).then((r) => r.data),

  addChecklistItem: (payload: { employeeId: number; title: string }) =>
    api.post<ChecklistItem>('/resignation/checklist', payload).then((r) => r.data),

  completeChecklistItem: (id: number) =>
    api.patch<ChecklistItem>(`/resignation/checklist/${id}/complete`).then((r) => r.data),
};
