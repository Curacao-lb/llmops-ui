<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import ChatMessage from '@/components/ChatMessage.vue'
  import { Message } from '@arco-design/web-vue'
  import { debugChat } from '@/services/app'
  import {
    useDeleteDebugConversation,
    useGetDebugConversationMessagesWithPage,
    useGetDebugConversationSummary,
    useGetDraftAppConfig,
    useStopDebugChat,
    useUpdateDebugConversationSummary,
  } from '@/hooks/use-app'
  import { useGenerateSuggestedQuestions } from '@/hooks/use-ai'
  import ModelConfig from './components/ModelConfig.vue'
  import PresetPromptTextArea from './components/PresetPromptTextArea.vue'
  import AgentAppAbility from './components/AgentAppAbility.vue'

  // 运行流程中的单个步骤（对应后端 agent_thoughts 里的一项）
  interface AgentThoughtItem {
    id?: string
    position?: number
    event?: string
    thought?: string
    observation?: string
    tool?: string
    tool_input?: Record<string, unknown>
    latency?: number
    created_at?: number
  }

  interface ChatMessageItem {
    role: 'human' | 'ai'
    content: string
    // AI 消息的运行流程步骤
    agent_thoughts?: AgentThoughtItem[]
  }

  // 应用基础信息由父级 AppLayoutView 通过 props 传入
  defineProps({
    app: {
      type: Object,
      default: () => ({}),
    },
  })

  const route = useRoute()
  const appId = route.params.app_id as string

  // 应用草稿配置
  const { draftAppConfigForm, loadDraftAppConfig } = useGetDraftAppConfig()

  // 调试会话相关 hooks
  const { handleStopDebugChat } = useStopDebugChat()
  const { handleDeleteDebugConversation } = useDeleteDebugConversation()
  const { messages: historyMessages, loadDebugConversationMessages } =
    useGetDebugConversationMessagesWithPage()
  const { suggested_questions, handleGenerateSuggestedQuestions } = useGenerateSuggestedQuestions()

  // 长期记忆相关
  const {
    loading: summaryLoading,
    debug_conversation_summary,
    loadDebugConversationSummary,
  } = useGetDebugConversationSummary()
  const { handleUpdateDebugConversationSummary } = useUpdateDebugConversationSummary()
  const summaryPopupVisible = ref(false)
  const summaryDraft = ref('')

  // 定义交互所需的数据
  const query = ref('')
  const currentMessages = ref<ChatMessageItem[]>([])
  const isLoading = ref(false)
  // 记录本次调试对话的任务id，用于中断生成
  const currentTaskId = ref('')
  // 记录本次消息id，用于回答后生成建议问题
  const currentMessageId = ref('')
  const typingQueue: string[] = []
  let typingTimer: number | undefined
  let resolveTyping: (() => void) | undefined

  const stopTyping = () => {
    if (typingTimer !== undefined) {
      window.clearInterval(typingTimer)
      typingTimer = undefined
    }
    typingQueue.length = 0
    resolveTyping?.()
    resolveTyping = undefined
  }

  const startTyping = () => {
    if (typingTimer !== undefined) return

    typingTimer = window.setInterval(() => {
      if (!typingQueue.length) {
        stopTyping()
        return
      }

      const message = currentMessages.value.at(-1)
      if (!message || message.role !== 'ai') {
        stopTyping()
        return
      }

      const character = typingQueue.shift()
      if (character !== undefined) {
        message.content += character
      }
    }, 20)
  }

  const waitForTyping = () => {
    if (!typingQueue.length && typingTimer === undefined) return Promise.resolve()

    return new Promise<void>((resolve) => {
      resolveTyping = resolve
    })
  }

  const getStreamContent = (data: Record<string, unknown> | undefined) => {
    const answer = data?.answer
    return typeof answer === 'string' ? answer : ''
  }

  // 将一次流式事件收集为当前 AI 消息的运行流程步骤
  const collectAgentThought = (event: string, data: Record<string, unknown> | undefined) => {
    const message = currentMessages.value.at(-1)
    if (!message || message.role !== 'ai') return

    message.agent_thoughts = message.agent_thoughts ?? []
    message.agent_thoughts.push({
      id: typeof data?.id === 'string' ? data.id : undefined,
      event,
      thought: typeof data?.thought === 'string' ? data.thought : '',
      observation: typeof data?.observation === 'string' ? data.observation : '',
      tool: typeof data?.tool === 'string' ? data.tool : '',
      tool_input:
        data?.tool_input && typeof data.tool_input === 'object'
          ? (data.tool_input as Record<string, unknown>)
          : {},
      latency: typeof data?.latency === 'number' ? data.latency : 0,
    })
  }

  // 清空调试会话：请求后端删除记录并清空本地消息
  const clearQuery = () => {
    handleDeleteDebugConversation(appId, () => {
      stopTyping()
      currentMessages.value = []
      suggested_questions.value = []
    })
  }

  // 停止本次生成
  const handleStop = async () => {
    if (!currentTaskId.value) return
    await handleStopDebugChat(appId, currentTaskId.value)
    stopTyping()
    isLoading.value = false
  }

  // 点击建议问题：填入并直接发送
  const sendSuggestedQuestion = (question: string) => {
    if (isLoading.value) return
    query.value = question
    sendQuery()
  }

  // 打开长期记忆弹层并加载当前摘要
  const openSummary = async () => {
    summaryPopupVisible.value = true
    await loadDebugConversationSummary(appId)
    summaryDraft.value = debug_conversation_summary.value
  }

  // 保存长期记忆
  const saveSummary = async () => {
    await handleUpdateDebugConversationSummary(appId, summaryDraft.value)
    debug_conversation_summary.value = summaryDraft.value
    summaryPopupVisible.value = false
  }

  const sendQuery = async () => {
    if (!query.value) {
      Message.error('请输入内容')
      return
    }

    if (isLoading.value === true) {
      Message.warning('请等待')
      return
    }

    const humanQuery = query.value

    currentMessages.value.push({
      role: 'human',
      content: humanQuery,
    })

    // 立即添加一个 loading 状态的 AI 消息
    currentMessages.value.push({
      role: 'ai',
      content: '',
      agent_thoughts: [],
    })

    query.value = ''
    isLoading.value = true
    currentTaskId.value = ''
    currentMessageId.value = ''
    suggested_questions.value = []

    try {
      await debugChat(appId, humanQuery, (event_response) => {
        // 1.提取流式事件响应数据以及事件名称
        const event = event_response?.event as string
        const data = event_response?.data as Record<string, unknown> | undefined

        // 记录任务id，用于中断本次生成
        const task_id = data?.task_id
        if (typeof task_id === 'string' && task_id) {
          currentTaskId.value = task_id
        }

        // 记录消息id，用于回答后生成建议问题
        const message_id = data?.message_id
        if (typeof message_id === 'string' && message_id) {
          currentMessageId.value = message_id
        }

        // 后端以 agent_message 事件传递文本，data.answer 为增量内容。
        if (event === 'agent_message') {
          const chunk_content = getStreamContent(data)
          typingQueue.push(...Array.from(chunk_content))
          startTyping()
        } else if (event && event !== 'ping') {
          // 其它事件（长期记忆召回/工具调用/知识库检索/运行结束等）收集为运行流程步骤
          collectAgentThought(event, data)
        }
      })
      await waitForTyping()

      // 若开启「回答后生成建议问题」，则根据消息id拉取建议问题
      if (draftAppConfigForm.value?.suggested_after_answer?.enable && currentMessageId.value) {
        try {
          await handleGenerateSuggestedQuestions(currentMessageId.value)
        } catch (e) {
          console.error(e)
        }
      }
    } catch (error) {
      stopTyping()
      Message.error('请求失败')
      console.error(error)
      // 失败时移除loading消息
      currentMessages.value.pop()
    } finally {
      isLoading.value = false
    }
  }

  onMounted(async () => {
    await Promise.all([loadDraftAppConfig(appId), loadDebugConversationMessages(appId, true)])

    // 将历史消息按时间正序展开为「人类提问 + AI回答」的消息列表
    const ordered = [...historyMessages.value].sort(
      (a, b) => (a.created_at ?? 0) - (b.created_at ?? 0)
    )
    const restored: ChatMessageItem[] = []
    for (const item of ordered) {
      if (item.query) restored.push({ role: 'human', content: item.query })
      if (item.answer) {
        restored.push({
          role: 'ai',
          content: item.answer,
          agent_thoughts: item.agent_thoughts ?? [],
        })
      }
    }
    currentMessages.value = restored
  })

  onBeforeUnmount(stopTyping)
</script>

<template>
  <!-- 最外层容器，填满父级内容区高度 -->
  <div class="h-full">
    <!-- 内容区 -->
    <div class="flex flex-row h-full">
      <!-- 左侧的编排 -->
      <div class="w-2/3 bg-gray-50 h-full flex flex-col">
        <header
          class="flex items-center gap-4 h-16 border-b border-gray-200 px-7 shrink-0 text-xl text-gray-700"
        >
          <span>应用编排</span>
          <!-- 模型配置 -->
          <model-config
            :app_id="appId"
            v-model:model_config="draftAppConfigForm.model_config"
            v-model:dialog_round="draftAppConfigForm.dialog_round"
          />
        </header>
        <div class="flex flex-row flex-1 min-h-0">
          <!-- 人设与回复逻辑 -->
          <div class="flex-1 border-r border-gray-200 py-4">
            <preset-prompt-text-area
              :app_id="appId"
              v-model:preset_prompt="draftAppConfigForm.preset_prompt"
            />
          </div>
          <!-- 应用能力 -->
          <div class="flex-1 py-4">
            <agent-app-ability :app_id="appId" v-model:draft_app_config="draftAppConfigForm" />
          </div>
        </div>
      </div>
      <!-- 右侧调试与预览 -->
      <div class="flex flex-col w-1/3 bg-white h-full">
        <header
          class="flex shrink-0 items-center justify-between h-16 px-4 text-xl bg-white border-b border-gray-200 shadow-sm"
        >
          <span>调试与预览</span>
          <!-- 长期记忆入口 -->
          <a-trigger
            v-model:popup-visible="summaryPopupVisible"
            :trigger="['click']"
            position="br"
            :popup-translate="[0, 8]"
            :unmount-on-close="false"
          >
            <a-button
              size="small"
              class="rounded-lg"
              title="长期记忆"
              @click="!summaryPopupVisible && openSummary()"
            >
              <template #icon>
                <icon-storage />
              </template>
            </a-button>
            <template #content>
              <a-card class="rounded-lg w-[360px]">
                <div class="text-sm font-semibold text-gray-700 mb-2">长期记忆</div>
                <a-spin :loading="summaryLoading" class="w-full">
                  <a-textarea
                    v-model:model-value="summaryDraft"
                    class="rounded-lg mb-3"
                    placeholder="记录调试会话过程中总结的长期记忆信息"
                    :auto-size="{ minRows: 4, maxRows: 8 }"
                    :max-length="2000"
                  />
                </a-spin>
                <div class="flex justify-end gap-2">
                  <a-button size="small" class="rounded-lg" @click="summaryPopupVisible = false">
                    取消
                  </a-button>
                  <a-button size="small" type="primary" class="rounded-lg" @click="saveSummary">
                    保存
                  </a-button>
                </div>
              </a-card>
            </template>
          </a-trigger>
        </header>
        <!-- 调试对话界面 -->
        <div class="h-full min-h-0 px-6 py-7 overflow-x-hidden overflow-y-scroll scrollbar-w-none">
          <!-- 当没任何消息的时候显示 -->
          <div
            v-if="!currentMessages.length"
            class="mt-[200px] flex flex-col items-center justify-center gap-2"
          >
            <a-avatar :size="70" shape="square" :style="{ backgroundColor: '#00d0b6' }">
              <icon-apps />
            </a-avatar>
            <div class="text-2xl font-semibold text-gray-900">聊天机器人</div>
          </div>
          <ChatMessage
            v-for="(msg, index) in currentMessages"
            :key="index"
            :role="msg.role"
            :message="msg.content"
            :agent-thoughts="msg.agent_thoughts"
            :loading="msg.role === 'ai' && isLoading && index === currentMessages.length - 1"
          />
        </div>
        <!-- 底部输入框 -->
        <div class="w-full shrink-0 flex flex-col border-t border-gray-200 bg-gray-50">
          <!-- 建议问题 -->
          <div
            v-if="!isLoading && suggested_questions.length"
            class="flex flex-wrap gap-2 px-3 sm:px-4 md:px-6 pt-3"
          >
            <a-button
              v-for="(question, idx) in suggested_questions"
              :key="idx"
              size="mini"
              class="rounded-full !text-gray-600"
              @click="sendSuggestedQuestion(question)"
            >
              {{ question }}
            </a-button>
          </div>
          <!-- 输入框容器 -->
          <div class="p-3 sm:p-4 md:p-6">
            <!-- 输入框组件 -->
            <div class="flex items-center gap-2 sm:gap-3 md:gap-4">
              <!-- 清除按钮 -->
              <a-button class="shrink-0" type="text" shape="circle" @click="clearQuery">
                <template #icon>
                  <icon-delete size="16" :style="{ color: '#374151' }" />
                </template>
              </a-button>
              <!-- 输入框主体 -->
              <div
                class="h-[40px] sm:h-[44px] md:h-[50px] flex items-center gap-2 px-3 sm:px-4 flex-1 min-w-0 border border-gray-200 rounded-full bg-white hover:border-gray-300 focus-within:border-blue-500 transition-colors"
              >
                <input
                  type="text"
                  placeholder="输入你的问题..."
                  class="flex-1 min-w-0 outline-none text-sm sm:text-base bg-transparent placeholder-gray-400"
                  v-model="query"
                  @keyup.enter="sendQuery"
                />
                <!-- 右侧按钮组 -->
                <div class="flex items-center gap-1 shrink-0">
                  <a-button type="text" shape="circle">
                    <template #icon>
                      <icon-plus-circle size="16" :style="{ color: '#374151' }" />
                    </template>
                  </a-button>
                  <!-- 生成中显示停止按钮，否则显示发送按钮 -->
                  <a-button
                    v-if="isLoading"
                    type="text"
                    shape="circle"
                    title="停止生成"
                    @click="handleStop"
                  >
                    <template #icon>
                      <icon-record-stop size="16" :style="{ color: '#dc2626' }" />
                    </template>
                  </a-button>
                  <a-button v-else type="text" shape="circle" @click="sendQuery">
                    <template #icon>
                      <icon-send size="16" :style="{ color: '#1d4ed8' }" />
                    </template>
                  </a-button>
                </div>
              </div>
            </div>
          </div>
          <!-- 底部提示文字 -->
          <div class="text-center text-gray-500 text-xs py-4">
            内容由AI生成，无法确保其实准确，仅供参考。
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
