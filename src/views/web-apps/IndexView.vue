<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { QueueEvent, title } from '@/config'
import { useGenerateSuggestedQuestions } from '@/hooks/use-ai'
import { useAudioToText } from '@/hooks/use-audio'
import { useAccountStore } from '@/stores/account'
import { useCredentialStore } from '@/stores/credential'
import { useLogout } from '@/hooks/use-auth'
import {
  useGetAppConversations,
  useGetWebApp,
  useStopWebAppChat,
  useWebAppChat,
} from '@/hooks/use-web-app'
import {
  useDeleteConversation,
  useGetConversationMessagesWithPage,
  useUpdateConversationIsPinned,
} from '@/hooks/use-conversation'
import UpdateNameModal from './components/UpdateNameModal.vue'
import ChatMessage from '@/components/ChatMessage.vue'
import AiMessage from '@/components/AiMessage.vue'
import { uploadImage } from '@/services/upload-file'

const route = useRoute()
const router = useRouter()
const token = String(route.params.token)
const accountStore = useAccountStore()
const credentialStore = useCredentialStore()
const { handleLogout } = useLogout()
const { loading: webAppLoading, web_app, loadWebApp } = useGetWebApp()
const {
  loading: conversationsLoading,
  pinned_conversations,
  unpinned_conversations,
  loadWebAppConversations,
} = useGetAppConversations()
const { loading: chatLoading, handleWebAppChat } = useWebAppChat()
const {
  loading: audioToTextLoading,
  recording,
  startRecording,
  stopRecording: stopAudioRecording,
  cancelRecording,
} = useAudioToText()
const {
  loading: suggestedQuestionsLoading,
  suggested_questions: suggestedQuestions,
  handleGenerateSuggestedQuestions,
} = useGenerateSuggestedQuestions()
const { loading: stopLoading, handleStopWebAppChat } = useStopWebAppChat()
const {
  messages,
  paginator,
  loading: messagesLoading,
  loadConversationMessagesWithPage,
} = useGetConversationMessagesWithPage()
const { handleDeleteConversation } = useDeleteConversation()
const { loading: pinLoading, handleUpdateConversationIsPinned } = useUpdateConversationIsPinned()

// An empty id represents the draft/new-conversation view. Keeping that state
// separate from the server-side conversation ids prevents stale content from
// remaining visible after a conversation is removed.
const selectedConversationId = ref('')
const query = ref('')
const imageUrls = ref<string[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const uploadLoading = ref(false)
const taskId = ref('')
const messageId = ref('')
const updateNameVisible = ref(false)
const updateNameConversationId = ref('')
const scroller = ref<HTMLElement | null>(null)
let composerGeneration = 0

const conversations = computed(() => [
  ...pinned_conversations.value,
  ...unpinned_conversations.value,
])
const selectedConversation = computed(() =>
  conversations.value.find((item) => item.id === selectedConversationId.value),
)
const isNewConversation = computed(() => selectedConversationId.value === '')
const multimodalEnabled = computed(() => Boolean(web_app.value.app_config?.multimodal?.enable))
const speechToTextEnabled = computed(() => Boolean(web_app.value.app_config?.speech_to_text?.enable))
const canLoadMore = computed(
  () =>
    !isNewConversation.value &&
    paginator.value.current_page <= paginator.value.total_page &&
    !messagesLoading.value,
)

const scrollToBottom = () => {
  nextTick(() => {
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
  })
}

const loadConversations = async () => {
  await loadWebAppConversations(token)
  if (
    selectedConversationId.value &&
    !conversations.value.some((item) => item.id === selectedConversationId.value)
  ) {
    addConversation()
  }
}

const selectConversation = async (conversationId: string) => {
  if (chatLoading.value) await handleStop()
  if (recording.value) await cancelRecording()
  composerGeneration += 1
  suggestedQuestions.value = []
  imageUrls.value = []
  selectedConversationId.value = conversationId
  if (conversationId === '') {
    messages.value = []
    return
  }
  await loadConversationMessagesWithPage(conversationId, true)
  scrollToBottom()
}

const openRename = (conversationId: string) => {
  updateNameConversationId.value = conversationId
  updateNameVisible.value = true
}

const submitOpeningQuestion = (question: string) => {
  query.value = question
  handleSubmit()
}

const addConversation = () => {
  if (recording.value) void cancelRecording()
  composerGeneration += 1
  suggestedQuestions.value = []
  selectedConversationId.value = ''
  messages.value = []
  query.value = ''
  imageUrls.value = []
}

const triggerFileInput = () => {
  if (imageUrls.value.length >= 5) {
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
  if (imageUrls.value.length >= 5) {
    Message.warning('一次最多上传 5 张图片')
    return
  }

  const uploadGeneration = composerGeneration
  try {
    uploadLoading.value = true
    const response = await uploadImage(file)
    if (composerGeneration !== uploadGeneration) {
      Message.warning('会话已切换，图片未添加')
      return
    }
    imageUrls.value.push(response.data.image_url)
    Message.success('图片上传成功')
  } catch (error) {
    Message.error(error instanceof Error ? error.message : '图片上传失败')
  } finally {
    uploadLoading.value = false
  }
}

const handleSubmit = async () => {
  if (recording.value || audioToTextLoading.value) {
    Message.warning('请先结束语音输入并等待识别完成')
    return
  }
  if (recording.value) {
    Message.warning('请先结束录音，再发送问题')
    return
  }
  if (uploadLoading.value) {
    Message.warning('图片仍在上传，请稍后再发送')
    return
  }
  if (!query.value.trim()) {
    Message.warning('用户提问不能为空')
    return
  }
  if (chatLoading.value) {
    Message.warning('上一次提问还未结束，请稍等')
    return
  }

  const humanQuery = query.value.trim()
  const humanImageUrls = [...imageUrls.value]
  query.value = ''
  imageUrls.value = []
  taskId.value = ''
  messageId.value = ''
  suggestedQuestions.value = []
  const currentMessage = {
    id: '',
    conversation_id: isNewConversation.value ? '' : selectedConversationId.value,
    query: humanQuery,
    image_urls: humanImageUrls,
    answer: '',
    total_token_count: 0,
    latency: 0,
    agent_thoughts: [] as Record<string, unknown>[],
    created_at: 0,
  }
  messages.value.unshift(currentMessage)
  let position = 0
  let answerCompleted = false
  scrollToBottom()

  await handleWebAppChat(
    token,
    {
      conversation_id: currentMessage.conversation_id,
      query: humanQuery,
      image_urls: humanImageUrls,
    },
    (eventResponse) => {
      const event = String(eventResponse.event ?? '')
      const data = (eventResponse.data ?? {}) as Record<string, unknown>
      if (event === QueueEvent.agentEnd) answerCompleted = true
      if (messageId.value === '' && data.message_id) {
        messageId.value = String(data.message_id)
        taskId.value = String(data.task_id ?? '')
        currentMessage.id = String(data.message_id)
        currentMessage.conversation_id = String(data.conversation_id ?? '')
      }
      if (event === QueueEvent.agentMessage) {
        currentMessage.answer += String(data.answer ?? data.thought ?? '')
        currentMessage.latency = Number(data.latency ?? currentMessage.latency)
        currentMessage.total_token_count = Number(
          data.total_token_count ?? currentMessage.total_token_count,
        )
      } else if (event === QueueEvent.error || event === QueueEvent.timeout) {
        currentMessage.answer = String(data.observation ?? data.thought ?? '生成失败')
      } else if (event !== QueueEvent.ping && event !== QueueEvent.agentEnd) {
        position += 1
        currentMessage.agent_thoughts.push({
          id: data.id,
          position,
          event: data.event,
          thought: data.thought,
          observation: data.observation,
          tool: data.tool,
          tool_input: data.tool_input,
          latency: data.latency,
          created_at: 0,
        })
      }
      scrollToBottom()
    },
  )

  if (
    web_app.value.app_config?.suggested_after_answer?.enable &&
    messageId.value &&
    answerCompleted
  ) {
    try {
      await handleGenerateSuggestedQuestions(messageId.value)
    } catch (error) {
      Message.error(error instanceof Error ? error.message : '建议问题生成失败')
    }
  }

  if (isNewConversation.value && currentMessage.conversation_id) {
    await loadConversations()
    selectedConversationId.value = currentMessage.conversation_id
  }
}

const toggleRecording = async () => {
  if (recording.value) {
    try {
      const text = (await stopAudioRecording(String(web_app.value.id ?? ''), token)).trim()
      if (text) query.value = [query.value.trim(), text].filter(Boolean).join(' ')
      else Message.info('没有识别到语音内容')
    } catch (error) {
      Message.error(error instanceof Error ? error.message : '语音识别失败')
    }
    return
  }
  if (!web_app.value.id) {
    Message.warning('应用信息尚未加载完成')
    return
  }
  try {
    await startRecording()
  } catch (error) {
    Message.error(error instanceof Error ? error.message : '无法启动录音，请检查麦克风权限')
  }
}

const handleStop = async () => {
  if (!taskId.value || !chatLoading.value) return
  await handleStopWebAppChat(token, taskId.value)
}

const loadMoreMessages = async () => {
  if (!isNewConversation.value && canLoadMore.value) {
    await loadConversationMessagesWithPage(selectedConversationId.value, false)
  }
}

const changePinned = async (conversation: { id: string }) => {
  const isPinned = pinned_conversations.value.some((item) => item.id === conversation.id)
  await handleUpdateConversationIsPinned(conversation.id, !isPinned, loadConversations)
}

const deleteConversation = (conversation: { id: string }) => {
  handleDeleteConversation(conversation.id, async () => {
    if (selectedConversationId.value === conversation.id) addConversation()
    await loadConversations()
  })
}

const logout = async () => {
  await handleLogout()
  credentialStore.clear()
  accountStore.clear()
  await router.replace({ name: 'auth-login', query: { redirect: route.fullPath } })
}

onMounted(async () => {
  await Promise.all([loadWebApp(token), loadConversations()])
  document.title = web_app.value.name || title
  addConversation()
})
</script>

<template>
  <div class="flex h-screen min-h-0 bg-white">
    <aside class="w-[280px] shrink-0 border-r border-gray-200 p-4 flex flex-col bg-white">
      <div class="flex items-center gap-3 mb-6">
        <a-avatar :size="36" shape="square" :image-url="web_app.icon" />
        <div class="min-w-0 flex-1">
          <a-skeleton v-if="webAppLoading" animation />
          <div v-else class="font-semibold text-gray-800 truncate">{{ web_app.name }}</div>
          <div class="text-xs text-gray-400 truncate">{{ web_app.description }}</div>
        </div>
      </div>
      <a-button type="primary" long class="rounded-lg mb-5" @click="addConversation">
        <template #icon><icon-edit /></template>
        新增会话
      </a-button>

      <div class="flex-1 min-h-0 overflow-y-auto">
        <section>
          <div class="mb-2 text-sm font-medium leading-5 text-gray-500">置顶会话</div>
          <a-spin :loading="conversationsLoading" class="conversation-list-spin block w-full">
            <a-empty
              v-if="!conversationsLoading && pinned_conversations.length === 0"
              description="暂无置顶会话"
              class="conversation-empty"
            />
            <div
              v-for="conversation in pinned_conversations"
              :key="conversation.id"
              class="group mb-1 flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium hover:bg-blue-50"
              :class="
                selectedConversationId === conversation.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700'
              "
              @click="selectConversation(conversation.id)"
            >
              <icon-message />
              <span class="flex-1 truncate">{{ conversation.name }}</span>
              <a-dropdown position="br" @click.stop>
                <a-button type="text" size="mini" class="invisible group-hover:visible">
                  <template #icon><icon-more /></template>
                </a-button>
                <template #content>
                  <a-doption :disabled="pinLoading" @click="changePinned(conversation)"
                    >取消置顶</a-doption
                  >
                  <a-doption @click="openRename(conversation.id)">重命名</a-doption>
                  <a-doption class="text-red-700" @click="deleteConversation(conversation)"
                    >删除</a-doption
                  >
                </template>
              </a-dropdown>
            </div>
          </a-spin>
        </section>

        <section class="mt-6">
          <div class="mb-2 text-sm font-medium leading-5 text-gray-500">会话列表</div>
          <a-spin :loading="conversationsLoading" class="conversation-list-spin block w-full">
            <a-empty
              v-if="!conversationsLoading && unpinned_conversations.length === 0"
              description="暂无会话"
              class="conversation-empty"
            />
            <div
              v-for="conversation in unpinned_conversations"
              :key="conversation.id"
              class="group mb-1 flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium hover:bg-blue-50"
              :class="
                selectedConversationId === conversation.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700'
              "
              @click="selectConversation(conversation.id)"
            >
              <icon-message />
              <span class="flex-1 truncate">{{ conversation.name }}</span>
              <a-dropdown position="br" @click.stop>
                <a-button type="text" size="mini" class="invisible group-hover:visible">
                  <template #icon><icon-more /></template>
                </a-button>
                <template #content>
                  <a-doption :disabled="pinLoading" @click="changePinned(conversation)"
                    >置顶会话</a-doption
                  >
                  <a-doption @click="openRename(conversation.id)">重命名</a-doption>
                  <a-doption class="text-red-700" @click="deleteConversation(conversation)"
                    >删除</a-doption
                  >
                </template>
              </a-dropdown>
            </div>
          </a-spin>
        </section>
      </div>

      <a-dropdown position="tl">
        <div class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
          <a-avatar :size="32" class="bg-blue-700">{{ accountStore.account.name?.[0] }}</a-avatar>
          <div class="min-w-0">
            <div class="text-sm text-gray-700 truncate">{{ accountStore.account.name }}</div>
            <div class="text-xs text-gray-400 truncate">{{ accountStore.account.email }}</div>
          </div>
        </div>
        <template #content><a-doption @click="logout">退出登录</a-doption></template>
      </a-dropdown>
    </aside>

    <main class="flex-1 min-w-0 flex flex-col bg-gray-50">
      <div
        class="h-16 shrink-0 border-b bg-white flex items-center justify-center font-semibold text-gray-800"
      >
        {{ isNewConversation ? '新的会话' : selectedConversation?.name || web_app.name }}
      </div>
      <div ref="scroller" class="flex-1 min-h-0 overflow-y-auto px-6 py-5">
        <div class="max-w-3xl mx-auto">
          <a-button
            v-if="canLoadMore"
            size="small"
            :loading="messagesLoading"
            @click="loadMoreMessages"
          >
            加载更早消息
          </a-button>
          <div v-if="messages.length" class="mt-4">
            <div
              v-for="item in messages.slice().reverse()"
              :key="item.id || item.query"
              class="mb-7"
            >
              <chat-message role="human" :message="item.query" :image_urls="item.image_urls" />
              <ai-message
                :app="web_app"
                :answer="item.answer"
                :message_id="item.id"
                :agent_thoughts="item.agent_thoughts"
                :latency="item.latency"
                :total_token_count="item.total_token_count"
                :loading="chatLoading && item.id === messageId"
                :enable_token_cost="true"
                :enable_text_to_speech="Boolean(web_app.app_config?.text_to_speech?.enable)"
                :auto_play_text_to_speech="Boolean(web_app.app_config?.text_to_speech?.auto_play)"
                :suggested_questions="item.id === messageId ? suggestedQuestions : []"
                :suggested_questions_loading="item.id === messageId && suggestedQuestionsLoading"
                @select-suggested-question="submitOpeningQuestion"
              />
            </div>
          </div>
          <div v-else class="min-h-[360px] flex flex-col items-center justify-center gap-4">
            <a-avatar :size="56" shape="square" :image-url="web_app.icon" />
            <div class="text-lg font-semibold text-gray-700">{{ web_app.name }}</div>
            <div
              v-if="web_app.app_config?.opening_statement"
              class="max-w-xl text-center text-gray-500"
            >
              {{ web_app.app_config.opening_statement }}
            </div>
            <div class="flex flex-wrap justify-center gap-2">
              <a-button
                v-for="question in web_app.app_config?.opening_questions || []"
                :key="question"
                size="small"
                @click="submitOpeningQuestion(question)"
              >
                {{ question }}
              </a-button>
            </div>
          </div>
        </div>
      </div>
      <div class="shrink-0 bg-white border-t p-4">
        <div class="max-w-3xl mx-auto flex items-end gap-3">
          <div
            class="flex-1 min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 focus-within:border-blue-500"
          >
            <div v-if="imageUrls.length > 0" class="flex flex-wrap gap-2 pb-2">
              <div
                v-for="(imageUrl, index) in imageUrls"
                :key="imageUrl"
                class="group relative h-12 w-12 overflow-hidden rounded-lg"
              >
                <a-image :src="imageUrl" width="48" height="48" fit="cover" />
                <button
                  type="button"
                  class="absolute inset-0 hidden items-center justify-center bg-black/50 text-white group-hover:flex"
                  :aria-label="`移除第 ${index + 1} 张图片`"
                  @click="imageUrls.splice(index, 1)"
                >
                  <icon-close />
                </button>
              </div>
            </div>
            <div class="flex items-end gap-2">
              <a-textarea
                v-model="query"
                :auto-size="{ minRows: 2, maxRows: 6 }"
                placeholder="请输入你的问题"
                class="flex-1"
                @keydown.enter.exact.prevent="handleSubmit"
              />
              <input
                v-if="multimodalEnabled"
                ref="fileInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleFileChange"
              />
              <a-button
                v-if="multimodalEnabled"
                :loading="uploadLoading"
                type="text"
                shape="circle"
                title="上传图片（最多 5 张）"
                :disabled="chatLoading || imageUrls.length >= 5"
                @click="triggerFileInput"
              >
                <template #icon><icon-plus /></template>
              </a-button>
              <a-button
                v-if="speechToTextEnabled"
                type="text"
                shape="circle"
                :loading="audioToTextLoading"
                :disabled="chatLoading || audioToTextLoading"
                :title="recording ? '结束录音并识别' : '语音输入'"
                @click="toggleRecording"
              >
                <template #icon>
                  <icon-voice :style="{ color: recording ? '#dc2626' : undefined }" />
                </template>
              </a-button>
            </div>
          </div>
          <a-button v-if="chatLoading" type="outline" :loading="stopLoading" @click="handleStop"
            >停止</a-button
          >
          <a-button
            v-else
            type="primary"
            :disabled="uploadLoading || recording || audioToTextLoading"
            @click="handleSubmit"
            >发送</a-button
          >
        </div>
      </div>
    </main>

    <update-name-modal
      v-model:visible="updateNameVisible"
      v-model:conversation_id="updateNameConversationId"
      :success_callback="loadConversations"
    />
  </div>
</template>

<style scoped>
.conversation-list-spin :deep(.arco-spin-children) {
  width: 100%;
}

.conversation-empty {
  padding: 14px 0 10px;
}

.conversation-empty :deep(.arco-empty-image) {
  height: 40px;
}

.conversation-empty :deep(.arco-empty-description) {
  margin-top: 6px;
  color: rgb(156 163 175);
  font-size: 12px;
  line-height: 18px;
}
</style>
