<script setup lang="ts">
  interface Props {
    avatar: string
    name: string
    message?: string
    isUser?: boolean
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    isUser: false,
    loading: false,
    message: '',
  })
</script>

<template>
  <div class="flex flex-row gap-2 mb-6">
    <!-- 头像 -->
    <a-avatar
      :size="30"
      class="shrink-0"
      :style="{ backgroundColor: isUser ? '#3370ff' : '#00d0b6' }"
    >
      <template v-if="isUser">{{ avatar }}</template>
      <icon-apps v-else />
    </a-avatar>
    <!-- 实际消息 -->
    <div class="flex flex-col gap-2">
      <div class="font-semibold text-gray-700">{{ name }}</div>
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
