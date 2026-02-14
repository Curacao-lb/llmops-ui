<script setup lang="ts">
  import { ref } from 'vue'

  interface Props {
    message?: string
    role: 'human' | 'ai'
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    role: 'ai',
    loading: false,
    message: '',
  })
  const isUser = ref(false)
  isUser.value = props.role === 'human'
</script>

<template>
  <div class="flex flex-row gap-2 mb-6">
    <!-- 头像 -->
    <a-avatar
      :size="30"
      class="shrink-0"
      :style="{ backgroundColor: isUser ? '#3370ff' : '#00d0b6' }"
    >
      <template v-if="isUser">蔡</template>
      <icon-apps v-else />
    </a-avatar>
    <!-- 实际消息 -->
    <div class="flex flex-col gap-2">
      <div class="font-semibold text-gray-700">{{ isUser ? '蔡小坤' : '聊天机器人' }}</div>
      <div
        :class="[
          'px-4 py-3 rounded-2xl leading-5 max-w-max',
          isUser
            ? 'bg-blue-700 text-white border border-blue-700'
            : 'bg-gray-100 text-black border border-gray-100',
        ]"
      >
        <icon-loading v-if="loading" class="animate-spin" />
        <template v-else>{{ message }}</template>
      </div>
    </div>
  </div>
</template>
