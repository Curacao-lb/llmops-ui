import request from '@/utils/request'
import type { BaseResponse } from '@/models/base'

// 利用AI优化预设Prompt，该接口为流式事件输出
export const optimizePrompt = (
  prompt: string,
  onData: (event_response: Record<string, unknown>) => void,
) => {
  return request.ssePost(`/ai/optimize-prompt`, { body: { prompt } }, onData)
}

// 根据传递的消息id获取建议问题列表
export const generateSuggestedQuestions = (message_id: string) => {
  return request.post<BaseResponse<string[]>>(`/ai/suggested-questions`, { message_id })
}
