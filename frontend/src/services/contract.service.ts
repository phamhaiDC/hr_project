import api from '@/lib/axios';
import type { Contract, PaginatedResponse } from '@/types';

export interface ListContractParams {
  page?: number;
  limit?: number;
  employeeId?: number;
  status?: string;
}

export interface CreateContractPayload {
  employeeId: number;
  type: string;
  startDate: string;
  endDate?: string;
  status?: string;
}

export const contractService = {
  list: (params?: ListContractParams) =>
    api.get<PaginatedResponse<Contract>>('/contracts', { params }).then((r) => r.data),

  get: (id: number) =>
    api.get<Contract>(`/contracts/${id}`).then((r) => r.data),

  create: (payload: CreateContractPayload) =>
    api.post<Contract>('/contracts', payload).then((r) => r.data),

  terminate: (id: number) =>
    api.patch<Contract>(`/contracts/${id}/terminate`).then((r) => r.data),
};
