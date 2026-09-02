<script setup lang="ts">
  import { type PropType, ref } from 'vue'
  import {
    useGetDebugConversationSummary,
    useUpdateDebugConversationSummary,
  } from '@/hooks/use-app'

  const props = defineProps({
    app_id: { type: String, required: true },
    // 长期记忆配置（含 enable 开关）
    long_term_memory: {
      type: Object as PropType<{ enable: boolean }>,
      default: () => ({ enable: false }),
    },
  })

  const {
    loading: summaryLoading,
    debug_conversation_summary,
    loadDebugConversationSummary,
  } = useGetDebugConversationSummary()
  const { loading: updateLoading, handleUpdateDebugConversationSummary } =
    useUpdateDebugConversationSummary()

  const summaryModalVisible = ref(false)

  // 打开长期记忆模态窗并加载当前摘要
  const openSummaryModal = async () => {
    await loadDebugConversationSummary(props.app_id)
    summaryModalVisible.value = true
  }

  // 保存长期记忆
  const saveSummary = async () => {
    await handleUpdateDebugConversationSummary(props.app_id, debug_conversation_summary.value)
    summaryModalVisible.value = false
  }
</script>

<template>
  <div>
    <!-- 预览与调试头部 -->
    <div class="flex items-center justify-between border-b border-gray-200 h-16 px-4">
      <div class="text-lg text-gray-700">预览与调试</div>
      <a-button
        :disabled="!props.long_term_memory?.enable"
        size="mini"
        type="text"
        class="rounded-lg px-1 !text-blue-700"
        @click="openSummaryModal"
      >
        <template #icon>
          <icon-storage />
        </template>
        长期记忆
      </a-button>
    </div>
    <!-- 长期记忆模态窗 -->
    <a-modal
      :width="520"
      v-model:visible="summaryModalVisible"
      hide-title
      :footer="false"
      modal-class="rounded-xl"
    >
      <!-- 顶部标题 -->
      <div class="flex items-center justify-between">
        <div class="text-lg font-bold text-gray-700">长期记忆</div>
        <a-button
          type="text"
          class="!text-gray-700"
          size="small"
          @click="summaryModalVisible = false"
        >
          <template #icon>
            <icon-close />
          </template>
        </a-button>
      </div>
      <!-- 底部表单 -->
      <div class="pt-6">
        <a-spin :loading="summaryLoading" class="w-full">
          <a-textarea
            v-model:model-value="debug_conversation_summary"
            placeholder="请输入当前调试会话长期记忆"
            show-word-limit
            :max-length="2000"
            :auto-size="{ minRows: 8, maxRows: 8 }"
          />
        </a-spin>
        <!-- 底部按钮 -->
        <div class="flex items-center justify-end pt-4">
          <a-space :size="16">
            <a-button class="rounded-lg" @click="summaryModalVisible = false">取消</a-button>
            <a-button
              :loading="updateLoading"
              type="primary"
              class="rounded-lg"
              @click="saveSummary"
            >
              保存
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style scoped></style>
