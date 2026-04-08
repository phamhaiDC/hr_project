import api from '@/lib/axios';

export interface SystemConfig {
  key: string;
  value: string;
  description?: string;
}

export const systemConfigService = {
  getAll: () =>
    api.get<SystemConfig[]>('/system-config').then((r) => r.data),

  update: (key: string, value: string) =>
    api.post<SystemConfig>('/system-config', { key, value }).then((r) => r.data),
};
