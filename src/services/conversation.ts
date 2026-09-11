import request from '@/utils/request'
import type { BaseResponse } from '@/models/base'
import type {
  GetConversationMessagesWithPageRequest,
  GetConversationMessagesWithPageResponse,
} from '@/models/conversation'

export const getConversationMessages = (
  conversation_id: string,
  req: GetConversationMessagesWithPageRequest
) => {
  return request.get<GetConversationMessagesWithPageResponse>(
    `/conversations/${conversation_id}/messages`,
    { params: req }
  )
}

export const deleteConversation = (conversation_id: string) => {
  return request.post<BaseResponse<unknown>>(`/conversations/${conversation_id}/delete`)
}

export const deleteMessage = (conversation_id: string, message_id: string) => {
  return request.post<BaseResponse<unknown>>(
    `/conversations/${conversation_id}/messages/${message_id}/delete`
  )
}

export const getConversationName = (conversation_id: string) => {
  return request.get<BaseResponse<{ name: string }>>(`/conversations/${conversation_id}/name`)
}

export const updateConversationName = (conversation_id: string, name: string) => {
  return request.post<BaseResponse<unknown>>(`/conversations/${conversation_id}/name`, { name })
}

export const updateConversationIsPinned = (conversation_id: string, is_pinned: boolean) => {
  return request.post<BaseResponse<unknown>>(`/conversations/${conversation_id}/is-pinned`, {
    is_pinned,
  })
}
