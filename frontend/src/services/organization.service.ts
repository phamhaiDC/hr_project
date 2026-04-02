import api from '@/lib/axios';
import type { Branch, Department, Position } from '@/types';

export const organizationService = {
  branches: () =>
    api.get<Branch[]>('/organization/branches').then((r) => r.data),

  departments: (branchId?: number) =>
    api
      .get<Department[]>('/organization/departments', {
        params: branchId ? { branchId } : undefined,
      })
      .then((r) => r.data),

  positions: (departmentId?: number) =>
    api
      .get<Position[]>('/organization/positions', {
        params: departmentId ? { departmentId } : undefined,
      })
      .then((r) => r.data),
};
