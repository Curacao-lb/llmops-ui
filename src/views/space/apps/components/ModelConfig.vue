<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { useUpdateDraftAppConfig } from '@/hooks/use-app'

  const props = defineProps({
    app_id: { type: String, default: '', required: true },
    model_config: {
      type: Object,
      default: () => ({}),
      required: true,
    },
    dialog_round: { type: Number, default: 3, required: true },
  })
  const emits = defineEmits(['update:model_config', 'update:dialog_round'])

  const { handleUpdateDraftAppConfig } = useUpdateDraftAppConfig()

  const form = ref<Record<string, any>>({
    provider: '',
    model: '',
    dialog_round: 3,
  })

  watch(
    () => props.model_config,
    (newValue) => {
      form.value.provider = newValue?.provider ?? ''
      form.value.model = newValue?.model ?? ''
    },
    { immediate: true }
  )

  watch(
    () => props.dialog_round,
    (newValue) => {
      form.value.dialog_round = newValue ?? 3
    },
    { immediate: true }
  )

  // 触发器隐藏时提交草稿配置更新
  const hideModelTrigger = () => {
    const model_config = {
      provider: form.value.provider,
      model: form.value.model,
      parameters: props.model_config?.parameters ?? {},
      baseUrl: props.model_config?.baseUrl ?? '',
      apiKey: props.model_config?.apiKey ?? '',
    }

    handleUpdateDraftAppConfig(props.app_id, {
      model_config,
      dialog_round: form.value.dialog_round,
    }).then(() => {
      emits('update:model_config', model_config)
      emits('update:dialog_round', form.value.dialog_round)
    })
  }
</script>

<template>
  <a-trigger trigger="click" position="bl" :popup-translate="[0, 12]" @hide="hideModelTrigger">
    <div class="flex items-center gap-1 cursor-pointer hover:bg-gray-100 px-1.5 py-1 rounded-lg">
      <a-avatar :size="16" shape="square" :style="{ backgroundColor: '#1d4ed8' }">
        <icon-robot />
      </a-avatar>
      <div class="text-gray-700 text-xs">{{ form.model || '未配置模型' }}</div>
      <icon-down />
    </div>
    <template #content>
      <div class="bg-white px-6 py-5 shadow rounded-lg w-[420px]">
        <div class="text-gray-700 text-base font-semibold mb-4">模型设置</div>
        <a-space direction="vertical" fill :size="16">
          <div class="flex items-center gap-2">
            <div class="text-xs text-gray-500 w-[100px] flex-shrink-0">提供商</div>
            <a-input v-model:model-value="form.provider" placeholder="如 openai" />
          </div>
          <div class="flex items-center gap-2">
            <div class="text-xs text-gray-500 w-[100px] flex-shrink-0">模型名称</div>
            <a-input v-model:model-value="form.model" placeholder="如 gpt-4o-mini" />
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1 text-xs text-gray-500 w-[100px] flex-shrink-0">
              携带上下文轮数
              <a-tooltip content="每次向Agent提问时携带的最近对话轮数，默认为3。">
                <icon-question-circle />
              </a-tooltip>
            </div>
            <a-slider
              v-model:model-value="form.dialog_round"
              :default-value="3"
              show-input
              :min="0"
              :max="10"
              :step="1"
            />
          </div>
        </a-space>
      </div>
    </template>
  </a-trigger>
</template>
