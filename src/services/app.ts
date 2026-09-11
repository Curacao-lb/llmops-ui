import request from '@/utils/request'
import type {
  CreateAppRequest,
  GetAppResponse,
  GetAppsWithPageRequest,
  GetAppsWithPageResponse,
  GetDebugConversationMessagesWithPageRequest,
  GetDebugConversationMessagesWithPageResponse,
  GetDraftAppConfigResponse,
  GetPublishedConfigResponse,
  GetPublishHistoriesWithPageResponse,
  RegenerateWebAppTokenResponse,
  UpdateAppRequest,
  UpdateDraftAppConfigRequest,
} from '@/models/app'
import type { BasePaginatorRequest, BaseResponse } from '@/models/base'

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

// 获取特定应用的草稿配置信息
export const getDraftAppConfig = (app_id: string) => {
  return request.get<GetDraftAppConfigResponse>(`/apps/${app_id}/draft-app-config`)
}

// 更新特定应用的草稿配置信息（注意后端路由为 draft-config）
export const updateDraftAppConfig = (app_id: string, req: UpdateDraftAppConfigRequest) => {
  return request.post<BaseResponse<unknown>>(`/apps/${app_id}/draft-config`, req)
}

type DebugChatOnData = (event_response: Record<string, unknown>) => void

// 应用调试对话，该接口为流式事件输出
export function debugChat(
  app_id: string,
  query: string,
  imageUrlsOrOnData: string[] | DebugChatOnData,
  onData?: DebugChatOnData
) {
  const image_urls = Array.isArray(imageUrlsOrOnData) ? imageUrlsOrOnData : undefined
  const callback = typeof imageUrlsOrOnData === 'function' ? imageUrlsOrOnData : onData

  return request.ssePost(
    `/apps/${app_id}/conversations`,
    { body: { query, ...(image_urls === undefined ? {} : { image_urls }) } },
    callback!
  )
}

// 停止某次应用的调试会话
export const stopDebugChat = (app_id: string, task_id: string) => {
  return request.post<BaseResponse<unknown>>(`/apps/${app_id}/conversations/tasks/${task_id}/stop`)
}

// 清空应用的调试会话记录
export const deleteDebugConversation = (app_id: string) => {
  return request.post<BaseResponse<unknown>>(
    `/apps/${app_id}/conversations/delete-debug-conversation`
  )
}

// 获取应用的调试会话消息分页列表
export const getDebugConversationMessagesWithPage = (
  app_id: string,
  req?: GetDebugConversationMessagesWithPageRequest
) => {
  return request.get<GetDebugConversationMessagesWithPageResponse>(
    `/apps/${app_id}/conversations/messages`,
    { params: req }
  )
}

// 发布/更新应用配置
export const publish = (app_id: string) => {
  return request.post<BaseResponse<unknown>>(`/apps/${app_id}/publish`)
}

// 取消发布指定应用
export const cancelPublish = (app_id: string) => {
  return request.post<BaseResponse<unknown>>(`/apps/${app_id}/cancel-publish`)
}

// 获取应用的发布历史分页列表（后端为 POST，分页参数走 query string）
export const getPublishHistoriesWithPage = (app_id: string, req: BasePaginatorRequest) => {
  return request.post<GetPublishHistoriesWithPageResponse>(
    `/apps/${app_id}/publish-histories`,
    {},
    { params: req }
  )
}

// 回退指定的历史配置版本到草稿
export const fallbackHistoryToDraft = (app_id: string, app_config_version_id: string) => {
  return request.post<BaseResponse<unknown>>(`/apps/${app_id}/fallback-history`, {
    app_config_version_id,
  })
}

// 获取应用的调试会话长期记忆
export const getDebugConversationSummary = (app_id: string) => {
  return request.get<BaseResponse<{ summary: string }>>(`/apps/${app_id}/summary`)
}

// 更新应用的调试会话长期记忆
export const updateDebugConversationSummary = (app_id: string, summary: string) => {
  return request.post<BaseResponse<unknown>>(`/apps/${app_id}/summary`, { summary })
}

// 获取指定应用的发布配置信息
export const getPublishedConfig = (app_id: string) => {
  return request.get<GetPublishedConfigResponse>(`/apps/${app_id}/published-config`)
}

// 重新生成 WebApp 访问凭证标识
export const regenerateWebAppToken = (app_id: string) => {
  return request.post<RegenerateWebAppTokenResponse>(
    `/apps/${app_id}/published-config/regenerate-web-app-token`
  )
}
