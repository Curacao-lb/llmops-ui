<script setup lang="ts">
  import { computed } from 'vue'
  import OpeningAbilityItem from './abilities/OpeningAbilityItem.vue'
  import LongTermMemoryAbilityItem from './abilities/LongTermMemoryAbilityItem.vue'
  import SuggestedAfterAnswerAbilityItem from './abilities/SuggestedAfterAnswerAbilityItem.vue'

  const props = defineProps({
    app_id: { type: String, default: '', required: true },
    draft_app_config: {
      type: Object,
      default: () => ({}),
      required: true,
    },
  })
  const emits = defineEmits(['update:draft_app_config'])

  // 双向绑定各字段：读取自 draft_app_config，写回时合并后向上抛出
  const buildField = <T,>(key: string, fallback: T) =>
    computed<T>({
      get: () => (props.draft_app_config?.[key] ?? fallback) as T,
      set: (value: T) => {
        emits('update:draft_app_config', { ...props.draft_app_config, [key]: value })
      },
    })

  const opening_statement = buildField<string>('opening_statement', '')
  const opening_questions = buildField<string[]>('opening_questions', [])
  const long_term_memory = buildField<{ enable: boolean }>('long_term_memory', { enable: false })
  const suggested_after_answer = buildField<{ enable: boolean }>('suggested_after_answer', {
    enable: true,
  })
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="px-4 mb-4 text-gray-700 font-bold">应用能力</div>
    <div class="flex-1 min-h-0 overflow-y-auto px-4 scrollbar-w-none">
      <a-collapse :default-active-key="['opening']" :bordered="false" expand-icon-position="right">
        <opening-ability-item
          :app_id="props.app_id"
          v-model:opening_statement="opening_statement"
          v-model:opening_questions="opening_questions"
        />
        <long-term-memory-ability-item
          :app_id="props.app_id"
          v-model:long_term_memory="long_term_memory"
        />
        <suggested-after-answer-ability-item
          :app_id="props.app_id"
          v-model:suggested_after_answer="suggested_after_answer"
        />
      </a-collapse>
    </div>
  </div>
</template>
