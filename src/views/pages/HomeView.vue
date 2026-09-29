<script setup lang="ts">
  import { computed, nextTick, ref } from 'vue'
  import { Message } from '@arco-design/web-vue'
  import AssistantAgentBackground from '@/assets/images/assistant-agent-background.png'
  import ChatMessage from '@/components/ChatMessage.vue'
  import AiMessage from '@/components/AiMessage.vue'
  import { FIXED_QUESTION, useAssistantAgentChat } from '@/hooks/use-assistant-agent'
  import { uploadImage } from '@/services/upload-file'

  const { loading, messages, handleSend, handleClear } = useAssistantAgentChat()

  // 仅允许提问固定问题（纯前端演示）
  const query = ref(FIXED_QUESTION)
  const image_urls = ref<string[]>([])
  const fileInput = ref<HTMLInputElement | null>(null)
  const uploadLoading = ref(false)
  const scroller = ref<HTMLElement | null>(null)

  // 最新一条消息的 id（用于标记正在生成中的消息）
  const lastMessageId = computed(() => messages.value[messages.value.length - 1]?.id ?? '')

  const scrollToBottom = () => {
    nextTick(() => {
      if (scroller.value) {
        scroller.value.scrollTop = scroller.value.scrollHeight
      }
    })
  }

  const onSubmit = async () => {
    if (loading.value) return
    // 强制锁定为固定问题，忽略其它输入
    await handleSend(FIXED_QUESTION, [...image_urls.value])
    image_urls.value = []
    query.value = FIXED_QUESTION
    scrollToBottom()
  }

  const onClear = () => {
    handleClear()
    image_urls.value = []
  }

  const triggerFileInput = () => {
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
      image_urls.value.push(response.data.image_url)
      Message.success('图片上传成功')
    } catch (error) {
      Message.error(error instanceof Error ? error.message : '图片上传失败')
    } finally {
      uploadLoading.value = false
    }
  }
</script>

<template>
  <div
    class="w-full h-full min-h-0 flex flex-col bg-gray-100 bg-cover bg-no-repeat bg-center"
    :style="{ backgroundImage: `url(${AssistantAgentBackground})` }"
  >
    <!-- 顶部标题 -->
    <div class="flex items-center justify-between h-16 px-6 flex-shrink-0">
      <div class="text-lg font-bold text-gray-700">辅助 Agent</div>
      <a-button
        v-if="messages.length > 0"
        size="small"
        class="rounded-lg !text-gray-700"
        @click="onClear"
      >
        <template #icon>
          <icon-refresh />
        </template>
        新会话
      </a-button>
    </div>

    <!-- 对话内容区 -->
    <div ref="scroller" class="flex-1 min-h-0 overflow-y-auto scrollbar-w-none px-6">
      <div class="w-[720px] max-w-full mx-auto">
        <!-- 空状态：欢迎信息 -->
        <div v-if="messages.length === 0" class="py-12">
          <div class="text-[32px] font-bold text-gray-700 mb-3">Hi，我是辅助 Agent</div>
          <div class="text-base text-gray-600 mb-8">
            点击下方的问题，体验一次纯前端模拟的对话（不调用真实大模型，仅用于演示）。
          </div>
          <!-- 固定问题引导 -->
          <div class="flex flex-wrap gap-2">
            <div
              class="px-4 py-2 border rounded-lg text-gray-700 cursor-pointer bg-white hover:bg-gray-50"
              @click="onSubmit"
            >
              {{ FIXED_QUESTION }}
            </div>
          </div>
        </div>

        <!-- 对话消息列表 -->
        <div v-else class="flex flex-col gap-6 py-6">
          <template v-for="item in messages" :key="item.id">
            <chat-message
              role="human"
              :message="item.query"
              :image_urls="item.image_urls"
            />
            <ai-message
              :app="{ name: '辅助 Agent' }"
              :answer="item.answer"
              :loading="loading && item.id === lastMessageId"
              :enable_agent_thought="false"
              :enable_token_cost="false"
              message_class="bg-white"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- 底部输入区 -->
    <div class="w-full flex flex-col flex-shrink-0">
      <div class="w-[720px] max-w-full mx-auto px-6">
        <div
          :class="[
            'flex flex-col justify-center gap-2 px-4 border border-gray-200 rounded-[24px] bg-white',
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
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileChange"
            />
            <!-- 固定问题：只读，避免自由输入 -->
            <input
              :value="FIXED_QUESTION"
              type="text"
              readonly
              class="flex-1 min-w-0 outline-0 bg-transparent text-gray-500 cursor-not-allowed"
              title="演示模式下仅可提问固定问题"
              @keyup.enter="onSubmit"
            />
            <a-button
              :loading="uploadLoading"
              type="text"
              shape="circle"
              class="!text-gray-700"
              title="上传图片（最多 5 张）"
              :disabled="loading || image_urls.length >= 5"
              @click="triggerFileInput"
            >
              <template #icon>
                <icon-plus :size="16" />
              </template>
            </a-button>
            <a-button
              :loading="loading"
              type="text"
              shape="circle"
              class="!text-blue-700"
              :disabled="uploadLoading"
              @click="onSubmit"
            >
              <template #icon>
                <icon-send :size="16" />
              </template>
            </a-button>
          </div>
        </div>
      </div>
      <!-- 底部提示 -->
      <div class="text-center text-gray-500 text-xs py-4">
        当前为前端演示：图片会上传并显示在消息中，回答仍为预设内容。
      </div>
    </div>
  </div>
</template>

<style scoped></style>
