import { type BasePaginatorResponse, type BaseResponse } from '@/models/base'

export type ApiToolHeader = {
  key: string
  value: string
}

export type ApiToolInput = {
  type: string
  name: string
  required: boolean
  description: string
}

export type ApiTool = {
  id: string
  name: string
  description: string
  inputs: ApiToolInput[]
}

export type ApiToolProvider = {
  id: string
  name: string
  icon: string
  description: string
  headers: Array<ApiToolHeader>
  tools: Array<ApiTool>
  created_at: number
  updated_at: number
}

export type GetApiToolProvidersWithPageResponse = BasePaginatorResponse<ApiToolProvider>

export type CreateApiToolProviderRequest = {
  name: string
  icon: string
  openapi_schema: string
  headers: Array<ApiToolHeader>
}

export type UpdateApiToolProviderRequest = {
  name: string
  icon: string
  openapi_schema: string
  headers: Array<ApiToolHeader>
}

export type ApiToolProviderDetail = {
  id: string
  name: string
  icon: string
  openapi_schema: string
  headers: Array<ApiToolHeader>
  created_at: number
}

export type GetApiToolProviderResponse = BaseResponse<ApiToolProviderDetail>

// 获取自定义API工具详情
export type GetApiToolResponse = BaseResponse<{
  id: string
  name: string
  description: string
  provider: {
    id: string
    name: string
    icon: string
    headers: { key: string; value: string }[]
    description: string
  }
  inputs: {
    type: string
    name: string
    required: boolean
    description: string
  }[]
}>
