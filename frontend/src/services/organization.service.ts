import api from '@/lib/axios';
import type { Branch, Department, DepartmentShift, Position, WorkingType } from '@/types';

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface BranchPayload {
  name: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export interface CreateDepartmentPayload {
  name: string;
  code: string;
  workingType?: WorkingType;
  description?: string;
  isActive?: boolean;
  branchId?: number;
}

export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload>;

export interface CreatePositionPayload {
  name: string;
  code: string;
  departmentId: number;
  description?: string;
  isActive?: boolean;
}

export type UpdatePositionPayload = Partial<CreatePositionPayload>;

// ── Service ───────────────────────────────────────────────────────────────────

export const organizationService = {
  // ── Branches ────────────────────────────────────────────────────────────────
  branches: () =>
    api.get<Branch[]>('/organization/branches').then((r) => r.data),

  createBranch: (payload: BranchPayload) =>
    api.post<Branch>('/organization/branches', payload).then((r) => r.data),

  updateBranch: (id: number, payload: Partial<BranchPayload>) =>
    api.put<Branch>(`/organization/branches/${id}`, payload).then((r) => r.data),

  // ── Departments ─────────────────────────────────────────────────────────────
  departments: (params?: { branchId?: number; activeOnly?: boolean }) =>
    api
      .get<Department[]>('/organization/departments', { params })
      .then((r) => r.data),

  department: (id: number) =>
    api.get<Department>(`/organization/departments/${id}`).then((r) => r.data),

  createDepartment: (payload: CreateDepartmentPayload) =>
    api.post<Department>('/organization/departments', payload).then((r) => r.data),

  updateDepartment: (id: number, payload: UpdateDepartmentPayload) =>
    api.patch<Department>(`/organization/departments/${id}`, payload).then((r) => r.data),

  deleteDepartment: (id: number) =>
    api.delete(`/organization/departments/${id}`),

  departmentShifts: (departmentId: number) =>
    api
      .get<DepartmentShift[]>(`/organization/departments/${departmentId}/shifts`)
      .then((r) => r.data),

  // ── Positions ───────────────────────────────────────────────────────────────
  positions: (params?: { departmentId?: number; activeOnly?: boolean }) =>
    api
      .get<Position[]>('/organization/positions', { params })
      .then((r) => r.data),

  position: (id: number) =>
    api.get<Position>(`/organization/positions/${id}`).then((r) => r.data),

  createPosition: (payload: CreatePositionPayload) =>
    api.post<Position>('/organization/positions', payload).then((r) => r.data),

  updatePosition: (id: number, payload: UpdatePositionPayload) =>
    api.patch<Position>(`/organization/positions/${id}`, payload).then((r) => r.data),

  deletePosition: (id: number) =>
    api.delete(`/organization/positions/${id}`),
};
