<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import dayjs from 'dayjs'
  import { useCancelPublish, useDeleteApp, useGetApp, usePublish } from '@/hooks/use-app'
  import PublishHistoryDrawer from './components/PublishHistoryDrawer.vue'
  import CreateOrUpdateAppModal from './components/CreateOrUpdateAppModal.vue'

  const route = useRoute()
  const router = useRouter()
  const appId = route.params.app_id as string

  const publishHistoryDrawerVisible = ref(false)
  const createOrUpdateAppModalVisible = ref(false)
  const updateAppId = ref('')
  const { loading, app, loadApp } = useGetApp()
  const { loading: publishLoading, handlePublish } = usePublish()
  const { handleCancelPublish } = useCancelPublish()
  const { handleDeleteApp } = useDeleteApp()

  // 打开编辑应用信息的模态窗
  const openEditApp = () => {
    updateAppId.value = appId
    createOrUpdateAppModalVisible.value = true
  }

  // 删除当前应用，成功后返回应用列表
  const doDeleteApp = () => {
    handleDeleteApp(appId, async () => {
      await router.push({ name: 'space-apps-list' })
    })
  }

  const doPublish = async () => {
    await handlePublish(appId)
    await loadApp(appId)
  }

  const doCancelPublish = () => {
    handleCancelPublish(appId, async () => await loadApp(appId))
  }

  onMounted(async () => {
    await loadApp(appId)
  })
</script>

<template>
  <div class="min-h-screen flex flex-col h-full overflow-hidden">
    <!-- 顶部导航 -->
    <div class="h-[77px] bg-gray-50 px-4 flex items-center justify-between relative border-b">
      <!-- 左侧应用信息 -->
      <div class="flex items-center gap-2">
        <a-button size="mini" @click="router.push({ name: 'space-apps-list' })">
          <template #icon>
            <icon-left />
          </template>
        </a-button>
        <div class="flex items-center gap-3">
          <a-avatar :size="40" shape="square" class="rounded-lg" :image-url="app.icon" />
          <div class="flex flex-col justify-between h-[40px]">
            <a-skeleton-line v-if="loading" :widths="[100]" />
            <a-dropdown v-else position="bl" trigger="click">
              <div
                class="flex items-center gap-1 text-gray-700 font-bold pb-1 cursor-pointer hover:text-blue-700 transition-colors"
              >
                {{ app.name }}
                <icon-down :size="14" />
              </div>
              <template #content>
                <a-doption @click="openEditApp">
                  <template #icon>
                    <icon-edit />
                  </template>
                  编辑信息
                </a-doption>
                <a-doption class="!text-red-700" @click="doDeleteApp">
                  <template #icon>
                    <icon-delete />
                  </template>
                  删除应用
                </a-doption>
              </template>
            </a-dropdown>
            <div class="flex items-center gap-2">
              <div class="flex items-center h-[18px] text-xs text-gray-500">
                <icon-user class="mr-1" />
                个人空间
              </div>
              <div class="flex items-center h-[18px] text-xs text-gray-500">
                <icon-schedule class="mr-1" />
                {{ app.status === 'published' ? '已发布' : '草稿' }}
              </div>
              <a-tag
                v-if="app.draft_updated_at"
                size="small"
                class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500"
              >
                已自动保存 {{ dayjs(app.draft_updated_at * 1000).format('HH:mm:ss') }}
              </a-tag>
            </div>
          </div>
        </div>
      </div>
      <!-- 中间导航菜单 -->
      <div class="absolute left-1/2 -translate-x-1/2">
        <a-space :size="24">
          <router-link
            :to="{ name: 'space-apps-detail', params: { app_id: appId } }"
            class="text-base font-bold"
            :class="route.name === 'space-apps-detail' ? 'text-blue-700' : 'text-gray-500'"
          >
            编排
          </router-link>
          <router-link
            :to="{ name: 'space-apps-analysis', params: { app_id: appId } }"
            class="text-base font-bold"
            :class="route.name === 'space-apps-analysis' ? 'text-blue-700' : 'text-gray-500'"
          >
            统计分析
          </router-link>
        </a-space>
      </div>
      <!-- 右侧按钮 -->
      <div>
        <a-space :size="12">
          <a-button
            :disabled="loading"
            class="rounded-lg"
            title="发布历史"
            @click="publishHistoryDrawerVisible = true"
          >
            <template #icon>
              <icon-history />
            </template>
          </a-button>
          <a-button-group>
            <a-button
              :disabled="loading"
              :loading="publishLoading"
              type="primary"
              class="!rounded-tl-lg !rounded-bl-lg"
              @click="doPublish"
            >
              更新发布
            </a-button>
            <a-dropdown position="br">
              <a-button type="primary" class="!rounded-tr-lg !rounded-br-lg !w-6">
                <template #icon>
                  <icon-down />
                </template>
              </a-button>
              <template #content>
                <a-doption
                  :disabled="app.status !== 'published'"
                  class="!text-red-700"
                  @click="doCancelPublish"
                >
                  取消发布
                </a-doption>
              </template>
            </a-dropdown>
          </a-button-group>
        </a-space>
      </div>
    </div>
    <!-- 底部内容区 -->
    <div class="flex-1 min-h-0">
      <router-view :app="app" />
    </div>
    <!-- 发布历史抽屉 -->
    <publish-history-drawer
      :app_id="appId"
      v-model:visible="publishHistoryDrawerVisible"
      @fallback-success="() => loadApp(appId)"
    />
    <!-- 编辑应用信息模态窗 -->
    <create-or-update-app-modal
      v-model:visible="createOrUpdateAppModalVisible"
      v-model:app_id="updateAppId"
      :callback="() => loadApp(appId)"
    />
  </div>
</template>
