import { ref } from 'vue'

// 辅助 Agent 演示对话中的单条消息
export interface AssistantMessage {
  id: string
  query: string
  answer: string
}

// 固定的演示问题：仅允许提问这一个问题（纯前端演示，不调用真实大模型）
export const FIXED_QUESTION = '你是谁？'

// 预设的模拟回答内容
const MOCK_ANSWER = [
  '你好，我是 LLMOps 平台的辅助 Agent 👋',
  '',
  '我可以帮你了解平台能力、指引你快速上手：',
  '· 在「个人空间」创建并编排属于你的 AI 应用；',
  '· 去「应用广场」体验平台内置的各类应用；',
  '· 为应用接入工具、知识库、工作流，打造更强的智能体。',
  '',
  '当前对话仅为纯前端演示，回答内容为预设文本，不会调用真实大模型，也不会产生任何费用。',
].join('\n')

export const useAssistantAgentChat = () => {
  // 是否正在“生成”回答
  const loading = ref(false)
  const messages = ref<AssistantMessage[]>([])
  let typingTimer: ReturnType<typeof setInterval> | null = null

  // 停止当前打字动画
  const stopTyping = () => {
    if (typingTimer) {
      clearInterval(typingTimer)
      typingTimer = null
    }
  }

  // 发送问题并以打字机方式模拟流式回答
  const handleSend = async (query: string): Promise<void> => {
    if (loading.value) return

    loading.value = true
    const current: AssistantMessage = {
      id: `${Date.now()}`,
      query,
      answer: '',
    }
    messages.value.push(current)

    // 模拟一次网络首字延迟
    await new Promise((resolve) => setTimeout(resolve, 400))

    // 打字机效果：逐步追加字符
    await new Promise<void>((resolve) => {
      let index = 0
      stopTyping()
      typingTimer = setInterval(() => {
        index += 2
        current.answer = MOCK_ANSWER.slice(0, index)
        if (index >= MOCK_ANSWER.length) {
          current.answer = MOCK_ANSWER
          stopTyping()
          resolve()
        }
      }, 30)
    })

    loading.value = false
  }

  // 清空会话
  const handleClear = () => {
    stopTyping()
    messages.value = []
    loading.value = false
  }

  return { loading, messages, handleSend, handleClear }
}
