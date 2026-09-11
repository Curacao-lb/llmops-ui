<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { QueueEvent, title } from '@/config'
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
const taskId = ref('')
const messageId = ref('')
const updateNameVisible = ref(false)
const updateNameConversationId = ref('')
const scroller = ref<HTMLElement | null>(null)

const conversations = computed(() => [
  ...pinned_conversations.value,
  ...unpinned_conversations.value,
])
const selectedConversation = computed(() =>
  conversations.value.find((item) => item.id === selectedConversationId.value),
)
const isNewConversation = computed(() => selectedConversationId.value === '')
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
  selectedConversationId.value = ''
  messages.value = []
  query.value = ''
}

const handleSubmit = async () => {
  if (!query.value.trim()) {
    Message.warning('用户提问不能为空')
    return
  }
  if (chatLoading.value) {
    Message.warning('上一次提问还未结束，请稍等')
    return
  }

  const humanQuery = query.value.trim()
  query.value = ''
  taskId.value = ''
  messageId.value = ''
  const currentMessage = {
    id: '',
    conversation_id: isNewConversation.value ? '' : selectedConversationId.value,
    query: humanQuery,
    image_urls: [],
    answer: '',
    total_token_count: 0,
    latency: 0,
    agent_thoughts: [] as Record<string, unknown>[],
    created_at: 0,
  }
  messages.value.unshift(currentMessage)
  let position = 0
  scrollToBottom()

  await handleWebAppChat(
    token,
    {
      conversation_id: currentMessage.conversation_id,
      query: humanQuery,
    },
    (eventResponse) => {
      const event = String(eventResponse.event ?? '')
      const data = (eventResponse.data ?? {}) as Record<string, unknown>
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

  if (isNewConversation.value && currentMessage.conversation_id) {
    await loadConversations()
    selectedConversationId.value = currentMessage.conversation_id
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
              <chat-message role="human" :message="item.query" />
              <ai-message
                :app="web_app"
                :answer="item.answer"
                :message_id="item.id"
                :agent_thoughts="item.agent_thoughts"
                :latency="item.latency"
                :total_token_count="item.total_token_count"
                :loading="chatLoading && item.id === messageId"
                :enable_token_cost="true"
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
          <a-textarea
            v-model="query"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            placeholder="请输入你的问题"
            @keydown.enter.exact.prevent="handleSubmit"
          />
          <a-button v-if="chatLoading" type="outline" :loading="stopLoading" @click="handleStop"
            >停止</a-button
          >
          <a-button v-else type="primary" @click="handleSubmit">发送</a-button>
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
