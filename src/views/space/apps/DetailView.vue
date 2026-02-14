<script setup lang="ts">
  import { ref } from 'vue'
  import { useRoute } from 'vue-router'
  import ChatMessage from '@/components/ChatMessage.vue'

  const route = useRoute()
  const appId = route.params.app_id

  const messages = ref([
    { avatar: '蔡', name: '蔡小坤', message: '你好', isUser: true },
    { avatar: 'AI', name: 'AI助手', message: '你好！有什么可以帮助你的吗？', isUser: false },
    { avatar: 'AI', name: 'AI助手', loading: true, isUser: false },
  ])
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
          <ChatMessage
            v-for="(msg, index) in messages"
            :key="index"
            :avatar="msg.avatar"
            :name="msg.name"
            :message="msg.message"
            :is-user="msg.isUser"
            :loading="msg.loading"
          />
        </div>
        <!-- 底部输入框 -->
        <div class="w-full shrink-0 flex flex-col border-t border-gray-200 bg-gray-50">
          <!-- 输入框容器 -->
          <div class="p-3 sm:p-4 md:p-6">
            <!-- 输入框组件 -->
            <div class="flex items-center gap-2 sm:gap-3 md:gap-4">
              <!-- 清除按钮 -->
              <a-button class="shrink-0" type="text" shape="circle">
                <template #icon>
                  <icon-empty size="16" :style="{ color: '#374151' }" />
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
                />
                <!-- 右侧按钮组 -->
                <div class="flex items-center gap-1 shrink-0">
                  <a-button type="text" shape="circle">
                    <template #icon>
                      <icon-plus-circle size="16" :style="{ color: '#374151' }" />
                    </template>
                  </a-button>
                  <a-button type="text" shape="circle">
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
