<script setup lang="ts">
  import { watch } from 'vue'
  import dayjs from 'dayjs'
  import { useFallbackHistoryToDraft, useGetPublishHistoriesWithPage } from '@/hooks/use-app'

  const props = defineProps({
    app_id: { type: String, default: '', required: true },
    visible: { type: Boolean, default: false, required: true },
  })
  const emits = defineEmits(['update:visible', 'fallback-success'])

  const { loading, publishHistories, paginator, loadPublishHistories } =
    useGetPublishHistoriesWithPage()
  const { handleFallbackHistoryToDraft } = useFallbackHistoryToDraft()

  // 抽屉展开时加载首页历史
  watch(
    () => props.visible,
    (newValue) => {
      if (newValue && props.app_id) {
        loadPublishHistories(props.app_id, true)
      }
    },
  )

  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 20) {
      loadPublishHistories(props.app_id)
    }
  }

  const formatTime = (created_at: number) => {
    return created_at ? dayjs(created_at * 1000).format('YYYY-MM-DD HH:mm:ss') : '-'
  }
</script>

<template>
  <a-drawer
    :visible="props.visible"
    :width="360"
    :footer="false"
    title="发布历史"
    @cancel="emits('update:visible', false)"
  >
    <div class="flex flex-col h-full">
      <div class="text-xs text-gray-500 mb-3">共 {{ paginator.total_record }} 条发布记录</div>
      <div class="flex-1 min-h-0 overflow-y-auto scrollbar-w-none" @scroll="handleScroll">
        <a-spin :loading="loading" class="w-full">
          <div
            v-if="!publishHistories.length && !loading"
            class="text-center text-gray-400 text-sm py-10"
          >
            暂无发布记录
          </div>
          <div
            v-for="history in publishHistories"
            :key="history.id"
            class="flex items-center justify-between px-3 py-3 mb-2 rounded-lg border border-gray-100 hover:bg-gray-50"
          >
            <div class="flex flex-col gap-1">
              <div class="text-sm text-gray-700 font-medium">版本 {{ history.version }}</div>
              <div class="text-xs text-gray-400">{{ formatTime(history.created_at) }}</div>
            </div>
            <a-button
              size="mini"
              class="rounded-lg"
              @click="
                async () => {
                  await handleFallbackHistoryToDraft(props.app_id, history.id, () => {
                    emits('fallback-success')
                    emits('update:visible', false)
                  })
                }
              "
            >
              回退
            </a-button>
          </div>
        </a-spin>
      </div>
    </div>
  </a-drawer>
</template>
