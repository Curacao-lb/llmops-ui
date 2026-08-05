import request from '@/utils/request'
import type { BasePaginatorRequest, BaseResponse } from '@/models/base'
import type {
  CreateApiKeyRequest,
  GetApiKeysWithPageResponse,
  UpdateApiKeyRequest,
} from '@/models/api-key'

// 创建 API 密钥
export const createApiKey = (req: CreateApiKeyRequest) => {
  return request.post<BaseResponse<unknown>>(`/openapi/api-keys`, req)
}

// 删除指定的 API 密钥
export const deleteApiKey = (api_key_id: string) => {
  return request.post<BaseResponse<unknown>>(`/openapi/api-keys/${api_key_id}/delete`)
}

// 修改指定的 API 密钥
export const updateApiKey = (api_key_id: string, req: UpdateApiKeyRequest) => {
  return request.post<BaseResponse<unknown>>(`/openapi/api-keys/${api_key_id}`, req)
}

// 修改指定 API 密钥的激活状态
export const updateApiKeyIsActive = (api_key_id: string, is_active: boolean) => {
  return request.post<BaseResponse<unknown>>(`/openapi/api-keys/${api_key_id}/is-active`, {
    is_active,
  })
}

// 获取当前账号的 API 密钥分页列表数据
export const getApiKeysWithPage = (req: BasePaginatorRequest) => {
  return request.get<GetApiKeysWithPageResponse>(`/openapi/api-keys`, { params: req })
}
