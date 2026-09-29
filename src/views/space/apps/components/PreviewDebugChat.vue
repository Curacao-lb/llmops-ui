<script setup lang="ts">
  /* eslint-disable @typescript-eslint/no-explicit-any */
  import { computed, nextTick, onMounted, type PropType, ref, watch } from 'vue'
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
  import { uploadImage } from '@/services/upload-file'
  import { useAudioToText } from '@/hooks/use-audio'

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
  const image_urls = ref<string[]>([])
  const fileInput = ref<HTMLInputElement | null>(null)
  const uploadLoading = ref(false)
  const {
    loading: audioToTextLoading,
    recording,
    startRecording,
    stopRecording: stopAudioRecording,
    cancelRecording,
  } = useAudioToText()
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
  const {
    loading: suggested_questions_loading,
    suggested_questions,
    handleGenerateSuggestedQuestions,
  } = useGenerateSuggestedQuestions()

  // 是否处于对话生成中
  const debugChatLoading = ref(false)
  const multimodalEnabled = computed(() => Boolean(props.app_config?.multimodal?.enable))
  const speechToTextEnabled = computed(() => Boolean(props.app_config?.speech_to_text?.enable))
  watch(multimodalEnabled, (enabled) => {
    if (!enabled) image_urls.value = []
  })

  watch(speechToTextEnabled, (enabled) => {
    if (!enabled && recording.value) void cancelRecording()
  })

  const toggleRecording = async () => {
    if (recording.value) {
      try {
        const text = (await stopAudioRecording(String(props.app?.id ?? ''))).trim()
        if (text) query.value = [query.value.trim(), text].filter(Boolean).join(' ')
        else Message.info('没有识别到语音内容')
      } catch (error) {
        Message.error(error instanceof Error ? error.message : '语音识别失败')
      }
      return
    }
    if (!props.app?.id) {
      Message.warning('应用信息尚未加载完成')
      return
    }
    try {
      await startRecording()
    } catch (error) {
      Message.error(error instanceof Error ? error.message : '无法启动录音，请检查麦克风权限')
    }
  }

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

  const triggerFileInput = () => {
    if (!multimodalEnabled.value) {
      Message.warning('请先在应用能力中开启多模态图片输入')
      return
    }
    if (image_urls.value.length >= 5) {
      Message.warning('一次最多上传 5 张图片')
      return
    }
    fileInput.value?.click()
  }

  const handleFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      Message.warning('请选择图片文件')
      return
    }
    if (image_urls.value.length >= 5) {
      Message.warning('一次最多上传 5 张图片')
      return
    }

    try {
      uploadLoading.value = true
      const response = await uploadImage(file)
      if (!multimodalEnabled.value) return
      image_urls.value.push(response.data.image_url)
      Message.success('图片上传成功')
    } catch (error) {
      Message.error(error instanceof Error ? error.message : '图片上传失败')
    } finally {
      uploadLoading.value = false
    }
  }

  // 提交提问
  const handleSubmit = async () => {
    if (recording.value || audioToTextLoading.value) {
      Message.warning('请先结束语音输入并等待识别完成')
      return
    }
    if (uploadLoading.value) {
      Message.warning('图片仍在上传，请稍后再发送')
      return
    }
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
      image_urls: [...image_urls.value],
      answer: '',
      total_token_count: 0,
      latency: 0,
      agent_thoughts: [] as Record<string, any>[],
      created_at: 0,
    }
    messages.value.unshift(currentMessage as (typeof messages.value)[number])

    let position = 0
    const humanQuery = query.value
    const humanImageUrls = [...image_urls.value]
    query.value = ''
    image_urls.value = []
    debugChatLoading.value = true
    scrollToBottom()

    try {
      await debugChat(props.app?.id, humanQuery, humanImageUrls, (event_response) => {
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
    image_urls.value = []
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
        <chat-message role="human" :message="item.query" :image_urls="item.image_urls" />
        <!-- AI 消息 -->
        <ai-message
          :enable_token_cost="true"
          :enable_agent_thought="true"
          :message_id="item.id"
          :agent_thoughts="item.agent_thoughts"
          :answer="item.answer"
          :app="props.app"
          :suggested_questions="item.id === message_id ? suggested_questions : []"
          :suggested_questions_loading="item.id === message_id && suggested_questions_loading"
          :loading="item.id === message_id && debugChatLoading"
          :latency="item.latency"
          :total_token_count="item.total_token_count"
          :enable_text_to_speech="Boolean(props.app_config?.text_to_speech?.enable)"
          :auto_play_text_to_speech="Boolean(props.app_config?.text_to_speech?.auto_play)"
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
          :disabled="uploadLoading || recording || audioToTextLoading"
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
          :class="[
            'flex flex-col justify-center gap-2 px-4 flex-1 min-w-0 border border-gray-200 rounded-[24px] bg-white focus-within:border-blue-500 transition-colors',
            image_urls.length > 0 ? 'min-h-[100px]' : 'h-[50px]',
          ]"
        >
          <div v-if="image_urls.length > 0" class="flex items-center gap-2 pt-2">
            <div
              v-for="(image_url, index) in image_urls"
              :key="image_url"
              class="group relative h-10 w-10 overflow-hidden rounded-lg"
            >
              <a-image :src="image_url" width="40" height="40" fit="cover" />
              <button
                type="button"
                class="absolute inset-0 hidden items-center justify-center bg-black/50 text-white group-hover:flex"
                :aria-label="`移除第 ${index + 1} 张图片`"
                @click="image_urls.splice(index, 1)"
              >
                <icon-close />
              </button>
            </div>
          </div>
          <div class="flex min-w-0 items-center gap-2">
            <input
              v-if="multimodalEnabled"
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileChange"
            />
            <input
              v-model="query"
              type="text"
              placeholder="输入你的问题..."
              class="flex-1 min-w-0 outline-0 bg-transparent"
              @keyup.enter="handleSubmit"
            />
            <a-button
              :loading="uploadLoading"
              type="text"
              shape="circle"
              class="!text-gray-700"
              :title="
                multimodalEnabled
                  ? '上传图片（最多 5 张）'
                  : '请先在应用能力中开启多模态图片输入'
              "
              :disabled="debugChatLoading || image_urls.length >= 5"
              @click="triggerFileInput"
            >
              <template #icon>
                <icon-plus :size="16" />
              </template>
            </a-button>
            <a-button
              v-if="speechToTextEnabled"
              type="text"
              shape="circle"
              class="!text-gray-700"
              :loading="audioToTextLoading"
              :disabled="debugChatLoading || audioToTextLoading"
              :title="recording ? '结束录音并识别' : '语音输入'"
              @click="toggleRecording"
            >
              <template #icon>
                <icon-voice :size="16" :style="{ color: recording ? '#dc2626' : undefined }" />
              </template>
            </a-button>
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
            <a-button
              v-else
              type="text"
              shape="circle"
              class="!text-blue-700"
              :disabled="uploadLoading || recording || audioToTextLoading"
              @click="handleSubmit"
            >
              <template #icon>
                <icon-send :size="16" />
              </template>
            </a-button>
          </div>
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
