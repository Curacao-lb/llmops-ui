<script setup lang="ts">
  import { computed } from 'vue'
  import OpeningAbilityItem from './abilities/OpeningAbilityItem.vue'
  import LongTermMemoryAbilityItem from './abilities/LongTermMemoryAbilityItem.vue'
  import SuggestedAfterAnswerAbilityItem from './abilities/SuggestedAfterAnswerAbilityItem.vue'
  import ContentReviewAbilityItem from './abilities/ContentReviewAbilityItem.vue'
  import AudioAbilityItem from './abilities/AudioAbilityItem.vue'
  import WorkflowsAbilityItem from './abilities/WorkflowsAbilityItem.vue'
  import MultimodalAbilityItem from './abilities/MultimodalAbilityItem.vue'

  type Workflow = { id: string; name: string; icon: string; description: string }
  type ReviewConfig = {
    enable: boolean
    keywords: string[]
    inputs_config: { enable: boolean; preset_response: string }
    outputs_config: { enable: boolean }
  }
  type AudioConfig = {
    speech_to_text: { enable: boolean }
    text_to_speech: { enable: boolean; voice: string; auto_play: boolean }
  }

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
  const review_config = buildField<ReviewConfig>('review_config', {
    enable: false,
    keywords: [],
    inputs_config: { enable: false, preset_response: '' },
    outputs_config: { enable: false },
  })
  const audio_config = computed<AudioConfig>({
    get: () => ({
      speech_to_text: props.draft_app_config?.speech_to_text ?? { enable: false },
      text_to_speech: props.draft_app_config?.text_to_speech ?? {
        enable: false,
        voice: 'echo',
        auto_play: false,
      },
    }),
    set: (value) => {
      emits('update:draft_app_config', { ...props.draft_app_config, ...value })
    },
  })
  const multimodal = buildField<{ enable: boolean }>('multimodal', { enable: false })
  const workflows = buildField<Workflow[]>('workflows', [])
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="px-4 mb-4 text-gray-700 font-bold">应用能力</div>
    <div class="flex-1 min-h-0 overflow-y-auto px-4 scrollbar-w-none">
      <a-collapse :default-active-key="['opening']" :bordered="false" expand-icon-position="right">
        <!-- 工作流组件 -->
        <workflows-ability-item :app_id="props.app_id" v-model:workflows="workflows" />
        <multimodal-ability-item :app_id="props.app_id" v-model:multimodal="multimodal" />
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
        <content-review-ability-item
          :app_id="props.app_id"
          v-model:review_config="review_config"
        />
        <audio-ability-item :app_id="props.app_id" v-model:audio_config="audio_config" />
      </a-collapse>
    </div>
  </div>
</template>
