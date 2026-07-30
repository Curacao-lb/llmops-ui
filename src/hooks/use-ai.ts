import { ref } from 'vue'
import { generateSuggestedQuestions, optimizePrompt } from '@/services/ai'

// 利用AI流式优化预设Prompt
export const useOptimizePrompt = () => {
  const loading = ref(false)
  const optimize_prompt = ref('')

  const handleOptimizePrompt = async (prompt: string) => {
    try {
      loading.value = true
      optimize_prompt.value = ''
      await optimizePrompt(prompt, (event_response) => {
        const data = event_response?.data as Record<string, unknown> | undefined
        const chunk = data?.optimize_prompt
        if (typeof chunk === 'string') {
          optimize_prompt.value += chunk
        }
      })
    } finally {
      loading.value = false
    }
  }

  return { loading, optimize_prompt, handleOptimizePrompt }
}

// 根据消息id生成建议问题列表
export const useGenerateSuggestedQuestions = () => {
  const loading = ref(false)
  const suggested_questions = ref<string[]>([])

  const handleGenerateSuggestedQuestions = async (message_id: string) => {
    try {
      loading.value = true
      const resp = await generateSuggestedQuestions(message_id)
      suggested_questions.value = resp.data
    } finally {
      loading.value = false
    }
  }

  return { loading, suggested_questions, handleGenerateSuggestedQuestions }
}
