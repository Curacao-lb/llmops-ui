import request from '@/utils/request'
import type { BaseResponse } from '@/models/base'
import type {
  GetWebAppConversationsResponse,
  GetWebAppResponse,
  WebAppChatRequest,
} from '@/models/web-app'

export const getWebApp = (token: string) => {
  return request.get<GetWebAppResponse>(`/web-apps/${token}`)
}

export const webAppChat = (
  token: string,
  req: WebAppChatRequest,
  onData: (event_response: Record<string, unknown>) => void
) => {
  return request.ssePost(`/web-apps/${token}/chat`, { body: req }, onData)
}

export const stopWebAppChat = (token: string, task_id: string) => {
  return request.post<BaseResponse<unknown>>(`/web-apps/${token}/chat/${task_id}/stop`)
}

export const getWebAppConversations = (token: string, is_pinned = false) => {
  return request.get<GetWebAppConversationsResponse>(`/web-apps/${token}/conversations`, {
    params: { is_pinned },
  })
}
