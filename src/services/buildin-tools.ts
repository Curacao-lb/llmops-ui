import request from '@/utils/request'
import {
  type GetCategoriesResponse,
  type GetBuiltinToolsResponse,
  type GetBuiltinToolResponse,
} from '@/models/buildin-tool'

// 获取分类列表
export const getCategories = () => {
  return request.get<GetCategoriesResponse>('/builtin-tools/categories')
}

// 获取内置工具列表
export const getBuiltinTools = () => {
  return request.get<GetBuiltinToolsResponse>('/builtin-tools')
}

// 获取内置工具详情
export const getBuiltinTool = (provider_name: string, tool_name: string) => {
  return request.get<GetBuiltinToolResponse>(
    `/builtin-tools/${provider_name}/tools/${tool_name}`,
  )
}
