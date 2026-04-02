import api from '@/lib/axios';
import type { Employee, PaginatedResponse } from '@/types';

export interface ListEmployeeParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  departmentId?: number;
  managerId?: number;
}

export interface CreateEmployeePayload {
  code: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  branchId: number;
  departmentId: number;
  positionId: number;
  managerId?: number;
  status?: string;
  role?: string;
}

export interface UpdateEmployeePayload {
  fullName?: string;
  email?: string;
  phone?: string;
  status?: string;
  role?: string;
  departmentId?: number;
  positionId?: number;
  managerId?: number;
}

export const employeeService = {
  list: (params?: ListEmployeeParams) =>
    api.get<PaginatedResponse<Employee>>('/employees', { params }).then((r) => r.data),

  get: (id: number) =>
    api.get<Employee>(`/employees/${id}`).then((r) => r.data),

  create: (payload: CreateEmployeePayload) =>
    api.post<Employee>('/employees', payload).then((r) => r.data),

  update: (id: number, payload: UpdateEmployeePayload) =>
    api.patch<Employee>(`/employees/${id}`, payload).then((r) => r.data),

  deactivate: (id: number) =>
    api.delete<Employee>(`/employees/${id}`).then((r) => r.data),

  history: (id: number) =>
    api.get(`/employees/${id}/history`).then((r) => r.data),
};
