<script setup lang="ts">
  import { computed, ref } from 'vue'

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
    thoughts?: AgentThoughtItem[]
    // 是否处于运行中（用于展示"运行中"提示）
    running?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    thoughts: () => [],
    running: false,
  })

  const expanded = ref(false)

  // 过滤出对"运行流程"有意义的步骤：排除纯文本回答块(agent_message)与心跳
  const steps = computed(() =>
    (props.thoughts ?? []).filter((item) => {
      const event = item.event ?? ''
      if (!event || event === 'ping' || event === 'agent_message') return false
      return true
    })
  )

  // 事件类型 -> 中文标题
  const eventLabelMap: Record<string, string> = {
    long_term_memory_recall: '长期记忆召回',
    agent_thought: '推理思考',
    agent_action: '工具调用',
    dataset_retrieval: '知识库检索',
    agent_message: '生成回答',
    agent_end: '运行结束',
  }

  const getEventLabel = (item: AgentThoughtItem) => {
    const event = item.event ?? ''
    if (event === 'agent_action' && item.tool) return `工具调用：${item.tool}`
    return eventLabelMap[event] ?? (event || '执行步骤')
  }

  const formatLatency = (latency?: number) => {
    if (typeof latency !== 'number' || latency <= 0) return ''
    return `${latency.toFixed(2)}s`
  }

  const stringify = (value: unknown) => {
    if (value === undefined || value === null) return ''
    if (typeof value === 'string') return value
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  const hasToolInput = (item: AgentThoughtItem) => {
    return item.tool_input && Object.keys(item.tool_input).length > 0
  }
</script>

<template>
  <!-- 仅在存在运行步骤时展示 -->
  <div v-if="steps.length" class="mt-1">
    <!-- 展开/收起入口 -->
    <button
      type="button"
      class="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
      @click="expanded = !expanded"
    >
      <icon-loading v-if="running" class="text-blue-500" />
      <icon-down v-else :class="['transition-transform', expanded ? '' : '-rotate-90']" />
      <span>{{ expanded ? '隐藏运行流程' : '显示运行流程' }}（{{ steps.length }} 步）</span>
    </button>

    <!-- 运行流程步骤列表 -->
    <div
      v-if="expanded"
      class="mt-2 flex flex-col gap-2 border-l-2 border-gray-200 pl-3 max-w-max"
    >
      <div
        v-for="(item, index) in steps"
        :key="item.id ?? index"
        class="flex flex-col gap-1 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2"
      >
        <!-- 步骤标题 + 耗时 -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-xs font-semibold text-gray-700">
            <span
              class="flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[10px]"
            >
              {{ index + 1 }}
            </span>
            <span>{{ getEventLabel(item) }}</span>
          </div>
          <span v-if="formatLatency(item.latency)" class="text-[11px] text-gray-400 shrink-0">
            {{ formatLatency(item.latency) }}
          </span>
        </div>

        <!-- 思考内容 -->
        <div v-if="item.thought" class="text-xs text-gray-600 whitespace-pre-wrap break-words">
          {{ item.thought }}
        </div>

        <!-- 工具入参 -->
        <div v-if="hasToolInput(item)" class="flex flex-col gap-0.5">
          <div class="text-[11px] text-gray-400">输入</div>
          <pre
            class="text-[11px] text-gray-600 bg-white border border-gray-200 rounded p-2 overflow-x-auto whitespace-pre-wrap break-words"
            >{{ stringify(item.tool_input) }}</pre
          >
        </div>

        <!-- 工具返回/观察结果 -->
        <div v-if="item.observation" class="flex flex-col gap-0.5">
          <div class="text-[11px] text-gray-400">输出</div>
          <pre
            class="text-[11px] text-gray-600 bg-white border border-gray-200 rounded p-2 overflow-x-auto whitespace-pre-wrap break-words"
            >{{ stringify(item.observation) }}</pre
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
