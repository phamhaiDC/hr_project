import api from '@/lib/axios';
import type { Shift } from '@/types';

export interface CreateWorkingShiftPayload {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  isCrossDay?: boolean;
  breakMinutes?: number;
  graceLateMinutes?: number;
  graceEarlyMinutes?: number;
  departmentId?: number | null;
  isDefault?: boolean;
  isActive?: boolean;
}

export type UpdateWorkingShiftPayload = Partial<CreateWorkingShiftPayload>;

export const workingShiftService = {
  findAll: (params?: {
    departmentId?: number;
    includeGlobal?: boolean;
    activeOnly?: boolean;
  }) =>
    api
      .get<Shift[]>('/working-shifts', { params })
      .then((r) => r.data),

  findOne: (id: number) =>
    api.get<Shift>(`/working-shifts/${id}`).then((r) => r.data),

  create: (payload: CreateWorkingShiftPayload) =>
    api.post<Shift>('/working-shifts', payload).then((r) => r.data),

  update: (id: number, payload: UpdateWorkingShiftPayload) =>
    api.patch<Shift>(`/working-shifts/${id}`, payload).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/working-shifts/${id}`),
};
