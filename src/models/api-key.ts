import type { BasePaginatorResponse } from '@/models/base'

// 新增 API 密钥请求
export type CreateApiKeyRequest = {
  is_active?: boolean
  remark?: string
}

// 修改 API 密钥请求
export type UpdateApiKeyRequest = {
  is_active?: boolean
  remark?: string
}

// 获取 API 密钥分页列表响应数据
export type GetApiKeysWithPageResponse = BasePaginatorResponse<{
  id: string
  api_key: string
  is_active: boolean
  remark: string
  updated_at: number
  created_at: number
}>
