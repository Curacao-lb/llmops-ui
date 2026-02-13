import request from '@/utils/request'

const API_BASE = 'http://127.0.0.1:8000'

export const api = {
  // Apps 相关接口
  apps: {
    debug: (appId: string, data?: unknown) =>
      request.post(`${API_BASE}/apps/${appId}/debug`, data),
  },
}
