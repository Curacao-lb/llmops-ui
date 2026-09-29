<script setup lang="ts">
  import { computed, ref, type PropType } from 'vue'
  import { Message } from '@arco-design/web-vue'
  import { useUpdateDraftAppConfig } from '@/hooks/use-app'

  type ReviewConfig = {
    enable: boolean
    keywords: string[]
    inputs_config: { enable: boolean; preset_response: string }
    outputs_config: { enable: boolean }
  }

  const props = defineProps({
    app_id: { type: String, default: '', required: true },
    review_config: {
      type: Object as PropType<ReviewConfig>,
      default: () => ({
        enable: false,
        keywords: [],
        inputs_config: { enable: false, preset_response: '' },
        outputs_config: { enable: false },
      }),
      required: true,
    },
  })
  const emits = defineEmits(['update:review_config'])
  const { loading: saving, handleUpdateDraftAppConfig } = useUpdateDraftAppConfig()

  const modalVisible = ref(false)
  const keywordsText = ref('')
  const inputReviewEnabled = ref(false)
  const presetResponse = ref('')
  const outputReviewEnabled = ref(false)

  const keywordList = computed(() =>
    keywordsText.value
      .split(/\r?\n/)
      .map((keyword) => keyword.trim())
      .filter(Boolean),
  )

  const openModal = () => {
    keywordsText.value = (props.review_config?.keywords ?? []).join('\n')
    inputReviewEnabled.value = Boolean(props.review_config?.inputs_config?.enable)
    presetResponse.value = props.review_config?.inputs_config?.preset_response ?? ''
    outputReviewEnabled.value = Boolean(props.review_config?.outputs_config?.enable)
    modalVisible.value = true
  }

  const saveReviewConfig = async () => {
    if (keywordList.value.length > 100) {
      Message.warning('关键词最多填写100个')
      return
    }
    if ((inputReviewEnabled.value || outputReviewEnabled.value) && keywordList.value.length === 0) {
      Message.warning('开启内容审核后，至少填写一个关键词')
      return
    }
    if (inputReviewEnabled.value && !presetResponse.value.trim()) {
      Message.warning('请输入输入审核的预设回复')
      return
    }

    const reviewConfig: ReviewConfig = {
      enable: inputReviewEnabled.value || outputReviewEnabled.value,
      keywords: keywordList.value,
      inputs_config: {
        enable: inputReviewEnabled.value,
        preset_response: presetResponse.value,
      },
      outputs_config: { enable: outputReviewEnabled.value },
    }

    try {
      await handleUpdateDraftAppConfig(props.app_id, { review_config: reviewConfig })
      emits('update:review_config', reviewConfig)
      modalVisible.value = false
    } catch (error) {
      Message.error(error instanceof Error ? error.message : '内容审核配置保存失败')
    }
  }

  const reviewEnabled = computed(() => Boolean(props.review_config?.enable))
</script>

<template>
  <div>
    <a-collapse-item key="content_review">
      <template #header>
        <div class="text-gray-700 font-bold">内容审核</div>
      </template>
      <template #extra>
        <a-button size="mini" class="rounded-lg px-2" @click.stop="openModal">
          {{ reviewEnabled ? '已开启' : '配置' }}
          <icon-settings class="ml-1" />
        </a-button>
      </template>
      <div class="text-xs text-gray-500 leading-[22px]">
        按关键词审核用户输入或 AI 输出内容。
      </div>
    </a-collapse-item>

    <a-modal
      :width="520"
      v-model:visible="modalVisible"
      hide-title
      :footer="false"
      modal-class="rounded-xl"
    >
      <div class="flex items-center justify-between">
        <div class="text-lg font-bold text-gray-700">内容审核</div>
        <a-button
          type="text"
          class="!text-gray-700"
          size="small"
          aria-label="关闭内容审核配置"
          @click="modalVisible = false"
        >
          <template #icon><icon-close /></template>
        </a-button>
      </div>

      <div class="pt-5">
        <div class="mb-2">
          <div class="text-sm text-gray-700">关键词 <span class="text-red-500">*</span></div>
          <div class="text-xs text-gray-400 mt-1">
            每行一个，用换行符分割，最多填写100个关键词
          </div>
        </div>
        <div class="relative">
          <a-textarea
            v-model:model-value="keywordsText"
            placeholder="每行一个，用换行符分隔。"
            :auto-size="{ minRows: 4, maxRows: 4 }"
            resize="none"
            class="pr-14"
          />
          <div class="absolute bottom-2 right-3 text-xs text-gray-400">
            {{ keywordList.length }}/100
          </div>
        </div>

        <div class="mt-5 rounded-lg border border-gray-100 p-3">
          <div class="flex items-center justify-between text-sm text-gray-700">
            <span>输入审核内容</span>
            <a-switch v-model:model-value="inputReviewEnabled" />
          </div>
          <div class="mt-3 mb-2 text-sm text-gray-700">预设回复</div>
          <a-textarea
            v-model:model-value="presetResponse"
            :disabled="!inputReviewEnabled"
            placeholder="请输入命中关键词后的预设回复内容"
            :auto-size="{ minRows: 3, maxRows: 3 }"
            resize="none"
          />
        </div>

        <div class="mt-4 rounded-lg border border-gray-100 p-3">
          <div class="flex items-center justify-between text-sm text-gray-700">
            <span>输出审核内容</span>
            <a-switch v-model:model-value="outputReviewEnabled" />
          </div>
        </div>

        <div class="flex items-center justify-end pt-5">
          <a-space :size="12">
            <a-button class="rounded-lg" :disabled="saving" @click="modalVisible = false">
              取消
            </a-button>
            <a-button
              type="primary"
              class="rounded-lg"
              :loading="saving"
              @click="saveReviewConfig"
            >
              保存
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>
  </div>
</template>
