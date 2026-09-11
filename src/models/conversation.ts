import type { BasePaginatorRequest, BasePaginatorResponse } from '@/models/base'

export type GetConversationMessagesWithPageRequest = BasePaginatorRequest & {
  created_at: number
}

export type GetConversationMessagesWithPageResponse = BasePaginatorResponse<{
  id: string
  conversation_id: string
  query: string
  image_urls: string[]
  answer: string
  total_token_count: number
  latency: number
  agent_thoughts: Record<string, unknown>[]
  created_at: number
}>
