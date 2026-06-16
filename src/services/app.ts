import request from '@/utils/request'
import type {
  CreateAppRequest,
  GetAppResponse,
  GetAppsWithPageRequest,
  GetAppsWithPageResponse,
  UpdateAppRequest,
} from '@/models/app'
import type { BaseResponse } from '@/models/base'

// 获取应用基础信息
export const getApp = (app_id: string) => {
  return request.get<GetAppResponse>(`/apps/${app_id}`)
}

// 在个人空间下新增应用
export const createApp = (req: CreateAppRequest) => {
  return request.post<BaseResponse<{ id: string }>>(`/apps`, req)
}

// 修改指定应用
export const updateApp = (app_id: string, req: UpdateAppRequest) => {
  return request.post<BaseResponse<unknown>>(`/apps/${app_id}`, req)
}

// 删除指定应用
export const deleteApp = (app_id: string) => {
  return request.post<BaseResponse<unknown>>(`/apps/${app_id}/delete`)
}

// 拷贝指定的应用
export const copyApp = (app_id: string) => {
  return request.post<BaseResponse<{ id: string }>>(`/apps/${app_id}/copy`)
}

// 获取应用分页列表数据
export const getAppsWithPage = (req: GetAppsWithPageRequest) => {
  return request.get<GetAppsWithPageResponse>(`/apps`, { params: req })
}
