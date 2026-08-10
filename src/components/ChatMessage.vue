<script setup lang="ts">
  import { ref } from 'vue'
  import AgentThought from '@/components/AgentThought.vue'

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

  interface Props {
    message?: string
    role: 'human' | 'ai'
    loading?: boolean
    // AI 消息的运行流程步骤
    agentThoughts?: AgentThoughtItem[]
  }

  const props = withDefaults(defineProps<Props>(), {
    role: 'ai',
    loading: false,
    message: '',
    agentThoughts: () => [],
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
        {{ message }}
        <span v-if="loading" class="cursor" aria-label="正在生成" />
      </div>
      <!-- 运行流程（仅 AI 消息展示） -->
      <agent-thought v-if="!isUser" :thoughts="props.agentThoughts" :running="props.loading" />
    </div>
  </div>
</template>

<style scoped>
  .cursor {
    display: inline-block;
    width: 1px;
    height: 14px;
    margin-left: 2px;
    background-color: #444;
    animation: blink 1s step-end infinite;
    vertical-align: middle;
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0;
    }
  }
</style>
