import type { BaseResponse } from '@/models/base'

export type GetWebAppResponse = BaseResponse<{
  id: string
  icon: string
  name: string
  description: string
  app_config: {
    opening_statement: string
    opening_questions: string[]
    suggested_after_answer: { enable: boolean }
    features: string[]
    speech_to_text: Record<string, unknown>
    text_to_speech: Record<string, unknown>
  }
}>

export type GetWebAppConversationsResponse = BaseResponse<
  {
    id: string
    name: string
    summary: string
    created_at: number
  }[]
>

export type WebAppChatRequest = {
  conversation_id?: string
  query: string
  image_urls?: string[]
}
