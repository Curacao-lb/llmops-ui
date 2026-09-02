<script setup lang="ts">
  /* eslint-disable @typescript-eslint/no-explicit-any */
  import { nextTick, onMounted, type PropType, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { Message } from '@arco-design/web-vue'
  import { debugChat } from '@/services/app'
  import {
    useDeleteDebugConversation,
    useGetDebugConversationMessagesWithPage,
    useStopDebugChat,
  } from '@/hooks/use-app'
  import { useGenerateSuggestedQuestions } from '@/hooks/use-ai'
  import { QueueEvent } from '@/config'
  import ChatMessage from '@/components/ChatMessage.vue'
  import AiMessage from '@/components/AiMessage.vue'

  const route = useRoute()
  const props = defineProps({
    app: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    app_config: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
  })

  const query = ref('')
  const message_id = ref('')
  const message_event = ref('')
  const task_id = ref('')
  const scroller = ref<HTMLElement | null>(null)
  const scrollHeight = ref(0)

  const { loading: deleteDebugConversationLoading, handleDeleteDebugConversation } =
    useDeleteDebugConversation()
  const {
    loading: getDebugConversationMessagesWithPageLoading,
    messages,
    loadDebugConversationMessages,
  } = useGetDebugConversationMessagesWithPage()
  const { loading: stopDebugChatLoading, handleStopDebugChat } = useStopDebugChat()
  const { suggested_questions, handleGenerateSuggestedQuestions } = useGenerateSuggestedQuestions()

  // 是否处于对话生成中
  const debugChatLoading = ref(false)

  // 滚动到底部
  const scrollToBottom = () => {
    nextTick(() => {
      if (scroller.value) {
        scroller.value.scrollTop = scroller.value.scrollHeight
      }
    })
  }

  // 记录/恢复滚动位置（加载历史消息时保持视图不跳动）
  const saveScrollHeight = () => {
    scrollHeight.value = scroller.value?.scrollHeight ?? 0
  }
  const restoreScrollPosition = () => {
    if (scroller.value) {
      scroller.value.scrollTop = scroller.value.scrollHeight - scrollHeight.value
    }
  }

  // 滚动到顶部时加载更多历史消息
  const handleScroll = async (event: Event) => {
    const { scrollTop } = event.target as HTMLElement
    if (scrollTop <= 0 && !getDebugConversationMessagesWithPageLoading.value) {
      saveScrollHeight()
      await loadDebugConversationMessages(String(route.params?.app_id), false)
      restoreScrollPosition()
    }
  }

  // 停止本次生成
  const handleStop = async () => {
    if (task_id.value === '' || !debugChatLoading.value) return
    await handleStopDebugChat(props.app?.id, task_id.value)
  }

  // 提交提问
  const handleSubmit = async () => {
    if (query.value.trim() === '') {
      Message.warning('用户提问不能为空')
      return
    }
    if (debugChatLoading.value) {
      Message.warning('上一次提问还未结束，请稍等')
      return
    }

    // 前置清理
    suggested_questions.value = []
    message_id.value = ''
    task_id.value = ''
    message_event.value = ''

    // 构建一条基础消息并添加到列表头部（index 0 为当前最新消息）
    // 后续流式更新均直接修改该对象引用，保证响应式且避免下标越界的类型问题
    const currentMessage = {
      id: '',
      conversation_id: '',
      query: query.value,
      image_urls: [] as string[],
      answer: '',
      total_token_count: 0,
      latency: 0,
      agent_thoughts: [] as Record<string, any>[],
      created_at: 0,
    }
    messages.value.unshift(currentMessage as (typeof messages.value)[number])

    let position = 0
    const humanQuery = query.value
    query.value = ''
    debugChatLoading.value = true
    scrollToBottom()

    try {
      await debugChat(props.app?.id, humanQuery, (event_response) => {
        const event = event_response?.event as string
        const data = event_response?.data as Record<string, any> | undefined
        const event_id = data?.id

        // 初始化任务id、消息id、会话id
        if (message_id.value === '' && data?.message_id) {
          task_id.value = data?.task_id
          message_id.value = data?.message_id
          currentMessage.id = data?.message_id
          currentMessage.conversation_id = data?.conversation_id
        }

        if (event === QueueEvent.agentEnd) {
          message_event.value = event
        }

        if (event && event !== QueueEvent.ping) {
          if (event === QueueEvent.agentMessage) {
            // 文本回答为增量叠加（后端以 data.answer 传递增量内容）
            currentMessage.answer += data?.answer ?? ''
            currentMessage.latency = data?.latency ?? currentMessage.latency
            currentMessage.total_token_count =
              data?.total_token_count ?? currentMessage.total_token_count
          } else if (event === QueueEvent.error) {
            currentMessage.answer = data?.observation ?? '生成失败'
          } else if (event === QueueEvent.timeout) {
            currentMessage.answer = '服务器繁忙，请稍后重试'
          } else {
            // 其它事件（长期记忆召回/工具调用/知识库检索等）收集为运行流程步骤
            position += 1
            currentMessage.agent_thoughts.push({
              id: event_id,
              position: position,
              event: data?.event,
              thought: data?.thought,
              observation: data?.observation,
              tool: data?.tool,
              tool_input: data?.tool_input,
              latency: data?.latency,
              created_at: 0,
            })
          }

          scrollToBottom()
        }
      })

      // 回答结束后生成建议问题
      if (
        props.app_config?.suggested_after_answer?.enable &&
        message_id.value &&
        message_event.value === QueueEvent.agentEnd
      ) {
        await handleGenerateSuggestedQuestions(message_id.value)
        setTimeout(() => scrollToBottom(), 100)
      }
    } catch (error) {
      Message.error('请求失败')
      console.error(error)
    } finally {
      debugChatLoading.value = false
    }
  }

  // 点击建议问题/开场白问题：填入并直接发送
  const handleSubmitQuestion = async (question: string) => {
    query.value = question
    await handleSubmit()
  }

  // 清空调试会话
  const handleClear = async () => {
    await handleStop()
    await handleDeleteDebugConversation(props.app?.id, async () => {
      await loadDebugConversationMessages(String(route.params?.app_id), true)
      suggested_questions.value = []
    })
  }

  onMounted(async () => {
    await loadDebugConversationMessages(String(route.params?.app_id), true)
    scrollToBottom()
  })
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <!-- 历史对话列表 -->
    <div
      v-if="messages.length > 0"
      ref="scroller"
      class="flex-1 min-h-0 px-6 overflow-x-hidden overflow-y-auto scrollbar-w-none"
      @scroll="handleScroll"
    >
      <div
        v-for="item in messages.slice().reverse()"
        :key="item.id || 'pending'"
        class="flex flex-col gap-6 py-6"
      >
        <!-- 人类消息 -->
        <chat-message role="human" :message="item.query" />
        <!-- AI 消息 -->
        <ai-message
          :enable_token_cost="true"
          :enable_agent_thought="true"
          :message_id="item.id"
          :agent_thoughts="item.agent_thoughts"
          :answer="item.answer"
          :app="props.app"
          :suggested_questions="item.id === message_id ? suggested_questions : []"
          :loading="item.id === message_id && debugChatLoading"
          :latency="item.latency"
          :total_token_count="item.total_token_count"
          @select-suggested-question="handleSubmitQuestion"
        />
      </div>
    </div>
    <!-- 对话为空时展示的开场白 -->
    <div
      v-else
      class="flex-1 min-h-0 flex flex-col p-6 gap-3 items-center justify-center overflow-y-auto scrollbar-w-none"
    >
      <!-- 应用图标与名称 -->
      <div class="flex flex-col items-center gap-2">
        <a-avatar :size="48" shape="square" class="rounded-lg" :image-url="props.app?.icon" />
        <div class="text-lg text-gray-700">{{ props.app?.name }}</div>
      </div>
      <!-- 对话开场白 -->
      <div
        v-if="props.app_config?.opening_statement"
        class="bg-gray-100 w-full px-4 py-3 rounded-lg text-gray-700 whitespace-pre-wrap"
      >
        {{ props.app_config?.opening_statement }}
      </div>
      <!-- 开场白建议问题 -->
      <div class="flex items-center flex-wrap gap-2 w-full">
        <div
          v-for="(opening_question, idx) in (props.app_config?.opening_questions || []).filter(
            (item: string) => item.trim() !== ''
          )"
          :key="idx"
          class="px-4 py-1.5 border rounded-lg text-gray-700 cursor-pointer hover:bg-gray-50"
          @click="async () => await handleSubmitQuestion(opening_question)"
        >
          {{ opening_question }}
        </div>
      </div>
    </div>
    <!-- 停止响应按钮 -->
    <div v-if="task_id && debugChatLoading" class="h-[50px] flex items-center justify-center">
      <a-button :loading="stopDebugChatLoading" class="rounded-lg px-2" @click="handleStop">
        <template #icon>
          <icon-poweroff />
        </template>
        停止响应
      </a-button>
    </div>
    <!-- 对话输入框 -->
    <div class="w-full flex flex-col flex-shrink-0">
      <div class="px-6 flex items-center gap-4">
        <!-- 清除按钮 -->
        <a-button
          :loading="deleteDebugConversationLoading"
          class="flex-shrink-0 !text-gray-700"
          type="text"
          shape="circle"
          title="清空会话"
          @click="handleClear"
        >
          <template #icon>
            <icon-delete :size="16" />
          </template>
        </a-button>
        <!-- 输入框组件 -->
        <div
          class="h-[50px] flex items-center gap-2 px-4 flex-1 min-w-0 border border-gray-200 rounded-[24px] bg-white focus-within:border-blue-500 transition-colors"
        >
          <input
            v-model="query"
            type="text"
            placeholder="输入你的问题..."
            class="flex-1 min-w-0 outline-0 bg-transparent"
            @keyup.enter="handleSubmit"
          />
          <!-- 生成中显示停止，否则显示发送 -->
          <a-button
            v-if="debugChatLoading"
            type="text"
            shape="circle"
            title="停止生成"
            @click="handleStop"
          >
            <template #icon>
              <icon-record-stop :size="16" :style="{ color: '#dc2626' }" />
            </template>
          </a-button>
          <a-button v-else type="text" shape="circle" class="!text-blue-700" @click="handleSubmit">
            <template #icon>
              <icon-send :size="16" />
            </template>
          </a-button>
        </div>
      </div>
      <!-- 底部提示信息 -->
      <div class="text-center text-gray-500 text-xs py-4">
        内容由AI生成，无法确保真实准确，仅供参考。
      </div>
    </div>
  </div>
</template>

<style scoped></style>
