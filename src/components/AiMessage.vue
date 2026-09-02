<script setup lang="ts">
  import { type PropType } from 'vue'
  import { Message } from '@arco-design/web-vue'
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

  const props = defineProps({
    // 应用基础信息（用于展示图标与名称）
    app: {
      type: Object as PropType<Record<string, unknown>>,
      default: () => ({}),
    },
    message_id: { type: String, default: '' },
    answer: { type: String, default: '' },
    loading: { type: Boolean, default: false },
    latency: { type: Number, default: 0 },
    total_token_count: { type: Number, default: 0 },
    agent_thoughts: {
      type: Array as PropType<AgentThoughtItem[]>,
      default: () => [],
    },
    suggested_questions: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    // 消息气泡的额外样式类，方便在不同背景下使用
    message_class: { type: String, default: 'bg-gray-100' },
    // 是否展示推理步骤
    enable_agent_thought: { type: Boolean, default: true },
    // 是否展示 token 消耗
    enable_token_cost: { type: Boolean, default: true },
  })

  const emits = defineEmits(['selectSuggestedQuestion'])

  // 复制回答内容到剪贴板
  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(props.answer)
      Message.success('复制成功')
    } catch (err) {
      Message.error(String(err))
    }
  }
</script>

<template>
  <div class="flex gap-2 group">
    <!-- 左侧图标 -->
    <a-avatar
      v-if="props.app?.icon"
      :size="30"
      shape="circle"
      class="flex-shrink-0"
      :image-url="String(props.app?.icon)"
    />
    <a-avatar v-else :size="30" shape="circle" class="flex-shrink-0" :style="{ backgroundColor: '#00d0b6' }">
      <icon-apps />
    </a-avatar>
    <!-- 右侧名称与消息 -->
    <div class="flex-1 flex flex-col items-start gap-2 min-w-0">
      <!-- 应用名称 -->
      <div class="text-gray-700 font-bold">{{ props.app?.name || '聊天机器人' }}</div>
      <!-- 推理步骤 -->
      <agent-thought
        v-if="enable_agent_thought"
        :thoughts="props.agent_thoughts"
        :running="props.loading"
      />
      <!-- AI 消息：加载中且暂无内容时展示等待动画 -->
      <div
        v-if="props.loading && props.answer.trim() === ''"
        :class="`${props.message_class} border border-gray-200 text-gray-700 px-4 py-3 rounded-2xl break-words`"
      >
        <span class="dot-flashing" aria-label="正在生成" />
      </div>
      <div
        v-else
        :class="`${props.message_class} markdown-body border border-gray-200 text-gray-700 px-4 py-3 rounded-2xl break-words whitespace-pre-wrap leading-6`"
      >{{ props.answer }}</div>
      <!-- 消息操作与数据 -->
      <div v-if="props.answer" class="w-full flex items-center justify-between">
        <a-space class="text-xs">
          <template #split>
            <a-divider direction="vertical" class="m-0" />
          </template>
          <!-- 文本复制 -->
          <div class="flex items-center gap-1 text-gray-500">
            <icon-copy class="cursor-pointer hover:text-gray-700" @click="copyText" />
          </div>
          <!-- 响应耗时 -->
          <div class="flex items-center gap-1 text-gray-500">
            <icon-check />
            {{ props.latency.toFixed(2) }}s
          </div>
          <!-- token 消耗 -->
          <div v-if="enable_token_cost" class="text-gray-500">
            {{ props.total_token_count }} Tokens
          </div>
        </a-space>
      </div>
      <!-- 建议问题列表 -->
      <div v-if="props.suggested_questions.length > 0" class="flex flex-wrap gap-2">
        <div
          v-for="(suggested_question, idx) in props.suggested_questions"
          :key="idx"
          class="px-4 py-1.5 border rounded-lg text-gray-700 cursor-pointer bg-white hover:bg-gray-50"
          @click="() => emits('selectSuggestedQuestion', suggested_question)"
        >
          {{ suggested_question }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* 等待生成时的三点闪烁动画 */
  .dot-flashing {
    position: relative;
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #9ca3af;
    color: #9ca3af;
    animation: dot-flashing 1s infinite linear alternate;
    animation-delay: 0.5s;
    margin: 4px 12px;
  }

  .dot-flashing::before,
  .dot-flashing::after {
    content: '';
    display: inline-block;
    position: absolute;
    top: 0;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #9ca3af;
    color: #9ca3af;
  }

  .dot-flashing::before {
    left: -12px;
    animation: dot-flashing 1s infinite alternate;
    animation-delay: 0s;
  }

  .dot-flashing::after {
    left: 12px;
    animation: dot-flashing 1s infinite alternate;
    animation-delay: 1s;
  }

  @keyframes dot-flashing {
    0% {
      background-color: #9ca3af;
    }

    50%,
    100% {
      background-color: rgba(156, 163, 175, 0.2);
    }
  }
</style>
