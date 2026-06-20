<script setup lang="ts">
  import { onBeforeUnmount, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import ChatMessage from '@/components/ChatMessage.vue'
  import { Message } from '@arco-design/web-vue'
  import { debugChat } from '@/services/app'

  interface ChatMessageItem {
    role: 'human' | 'ai'
    content: string
  }

  const route = useRoute()
  const appId = route.params.app_id as string

  // 定义交互所需的数据
  const query = ref('')
  const currentMessages = ref<ChatMessageItem[]>([])
  const isLoading = ref(false)
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

  const clearQuery = () => {
    currentMessages.value = []
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
    })

    query.value = ''
    isLoading.value = true

    try {
      await debugChat(appId, humanQuery, (event_response) => {
        // 1.提取流式事件响应数据以及事件名称
        const event = event_response?.event as string
        const data = event_response?.data as Record<string, unknown> | undefined

        // 2.获取最后一条消息
        const lastIndex = currentMessages.value.length - 1
        const message = currentMessages.value[lastIndex]
        if (!message) return

        // 3.暂时只处理agent_message事件，其他事件类型等接口开发完毕后再添加
        if (event === 'agent_message') {
          const chunk_content = (data?.data as string) ?? ''
          typingQueue.push(...Array.from(chunk_content))
          startTyping()
        }
      })
      await waitForTyping()
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

  onBeforeUnmount(stopTyping)
</script>

<template>
  <!-- 最外层容器，高度撑满整个浏览器屏幕 -->
  <div class="min-h-screen">
    <!-- 顶部导航 -->
    <header class="flex items-center h-[74px] bg-gray-100 border-b border-gray-200 px-4">
      顶部导航
    </header>
    <!-- 底部内容区 -->
    <div class="flex flex-row h-[calc(100vh-74px)]">
      <!-- 左侧的编排 -->
      <div class="w-2/3 bg-gray-50 h-full">
        <header class="flex items-center h-16 border-b border-gray-200 px-7 text-xl text-gray-700">
          应用编排
        </header>
        <div class="flex flex-row h-[calc(100%-64px)]">
          <div class="flex-1 border-r border-gray-200 p-6">人设与回复逻辑</div>
          <div class="flex-1 p-6">应用能力</div>
        </div>
      </div>
      <!-- 右侧调试与预览 -->
      <div class="flex flex-col w-1/3 bg-white h-full">
        <header
          class="flex shrink-0 items-center h-16 px-4 text-xl bg-white border-b border-gray-200 shadow-sm"
        >
          调试与预览
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
            :loading="msg.role === 'ai' && isLoading && index === currentMessages.length - 1"
          />
        </div>
        <!-- 底部输入框 -->
        <div class="w-full shrink-0 flex flex-col border-t border-gray-200 bg-gray-50">
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
                  <a-button type="text" shape="circle" @click="sendQuery">
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
