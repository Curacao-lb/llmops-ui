import request from '@/utils/request'
import {
  type GetCategoriesResponse,
  type GetBuiltinToolsResponse,
  type GetBuiltinToolResponse,
} from '@/models/buildin-tool'

// 获取分类列表（拦截器已拆包，返回里层 data）
export const getCategories = () => {
  return request.get<GetCategoriesResponse['data']>('/builtin-tools/categories')
}

// 获取内置工具列表
export const getBuiltinTools = () => {
  return request.get<GetBuiltinToolsResponse['data']>('/builtin-tools')
}

// 获取内置工具详情
export const getBuiltinTool = (provider_name: string, tool_name: string) => {
  return request.get<GetBuiltinToolResponse['data']>(
    `/builtin-tools/${provider_name}/tools/${tool_name}`,
  )
}
