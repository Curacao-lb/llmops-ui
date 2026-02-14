import request from '@/utils/request'

const API_BASE = 'http://127.0.0.1:8000'

interface DebugRequest {
  query: string
  inputs?: Record<string, unknown>
  conversation_id?: string
}

interface DebugResponse {
  content: string
  conversation_id: string
  [key: string]: unknown
}

export const api = {
  // Apps 相关接口
  apps: {
    debug: (appId: string, data: DebugRequest) =>
      request.post<DebugResponse>(`${API_BASE}/apps/${appId}/debug`, data),
  },
}
