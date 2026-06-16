import request from '@/utils/request'
import type {
  GetApiToolProvidersWithPageResponse,
  CreateApiToolProviderRequest,
  UpdateApiToolProviderRequest,
  GetApiToolProviderResponse,
  GetApiToolResponse,
} from '@/models/api-tool'
import type { BaseResponse } from '@/models/base'

export const getApiToolProvidersWithPage = (
  current_page: number = 1,
  page_size: number = 20,
  search_word: string = '',
) => {
  return request.get<GetApiToolProvidersWithPageResponse>('/api-tools', {
    params: { current_page, page_size, search_word },
  })
}

// 校验OpenAPI Schema数据
export const validateOpenAPISchema = (openapi_schema: string) => {
  return request.post<BaseResponse<unknown>>('/api-tools/validate-openapi-schema', {
    openapi_schema,
  })
}

// 创建自定义API工具提供者
export const createApiToolProvider = (req: CreateApiToolProviderRequest) => {
  return request.post<BaseResponse<unknown>>('/api-tools', req)
}

// 删除自定义API工具提供者
export const deleteApiToolProvider = (provider_id: string) => {
  return request.post<BaseResponse<unknown>>(`/api-tools/${provider_id}/delete`)
}

// 更新自定义API工具提供者
export const updateApiToolProvider = (provider_id: string, req: UpdateApiToolProviderRequest) => {
  return request.post<BaseResponse<unknown>>(`/api-tools/${provider_id}`, req)
}

// 查看自定义API工具提供者
export const getApiToolProvider = (provider_id: string) => {
  return request.get<GetApiToolProviderResponse>(`/api-tools/${provider_id}`)
}

// 获取API工具详情信息
export const getApiTool = (provider_id: string, tool_name: string) => {
  return request.get<GetApiToolResponse>(`/api-tools/${provider_id}/tools/${tool_name}`)
}
