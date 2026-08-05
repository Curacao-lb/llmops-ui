<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { Message } from '@arco-design/web-vue'
  import dayjs from 'dayjs'
  import {
    useDeleteApiKey,
    useGetApiKeysWithPage,
    useUpdateApiKeyIsActive,
  } from '@/hooks/use-api-key'
  import CreateOrUpdateApiKeyModal from './components/CreateOrUpdateApiKeyModal.vue'

  const route = useRoute()
  const router = useRouter()
  const props = defineProps({
    create_api_key: { type: Boolean, default: false, required: true },
  })
  const emits = defineEmits(['update:create_api_key'])

  const {
    loading: getApiKeysWithPageLoading,
    paginator,
    api_keys,
    loadApiKeys,
  } = useGetApiKeysWithPage()
  const { handleUpdateApiKeyIsActive } = useUpdateApiKeyIsActive()
  const { handleDeleteApiKey } = useDeleteApiKey()

  const createOrUpdateApiKeyModalVisible = ref(false)
  const updateApiKeyId = ref('')
  const updateApiKeyIsActive = ref(false)
  const updateApiKeyRemark = ref('')

  const req = computed(() => {
    return {
      current_page: Number(route.query?.current_page ?? 1),
      page_size: Number(route.query?.page_size ?? 20),
    }
  })

  // 切换密钥激活状态，成功后同步本地列表数据
  const onToggleActive = (api_key_id: string, rowIndex: number, value: boolean) => {
    handleUpdateApiKeyIsActive(api_key_id, value, () => {
      const row = api_keys.value[rowIndex]
      if (row) row.is_active = Boolean(value)
    })
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      Message.success('复制成功')
    } catch (err) {
      Message.error(String(err))
    }
  }

  onMounted(async () => {
    await loadApiKeys(true, req.value)
  })

  // 顶层布局点击“新增密钥”时，打开新增模态窗
  watch(
    () => props.create_api_key,
    (value) => {
      updateApiKeyId.value = ''
      createOrUpdateApiKeyModalVisible.value = Boolean(value)
    }
  )

  // 分页切换时重新加载列表
  watch(
    () => route.query,
    async (newQuery, oldQuery) => {
      if (newQuery.current_page != oldQuery.current_page) {
        await loadApiKeys(false, req.value)
      }
    }
  )
</script>

<template>
  <div class="h-[calc(100vh-160px)] overflow-scroll scrollbar-w-none">
    <a-table
      hoverable
      :pagination="{
        total: paginator.total_record,
        current: paginator.current_page,
        defaultCurrent: 1,
        pageSize: paginator.page_size,
        defaultPageSize: 20,
        showTotal: true,
      }"
      :loading="getApiKeysWithPageLoading"
      :bordered="{ wrapper: false }"
      :data="api_keys"
      @page-change="
        (page: number) => {
          router.push({ path: route.path, query: { current_page: page } })
        }
      "
    >
      <template #columns>
        <a-table-column
          title="密钥"
          data-index="api_key"
          :width="400"
          header-cell-class="rounded-tl-lg !bg-gray-200 text-gray-700"
          cell-class="bg-transparent text-gray-700"
        >
          <template #cell="{ record }">
            <div class="flex items-center">
              <div class="line-clamp-1">{{ record.api_key }}</div>
              <a-button
                size="mini"
                class="flex-shrink-0 rounded"
                @click="async () => copyToClipboard(record.api_key)"
              >
                <template #icon>
                  <icon-copy />
                </template>
              </a-button>
            </div>
          </template>
        </a-table-column>
        <a-table-column
          title="状态"
          data-index="is_active"
          header-cell-class="!bg-gray-200 text-gray-700"
          cell-class="bg-transparent text-gray-700"
        >
          <template #cell="{ record }">
            <a-space>
              <div
                v-if="record.is_active"
                class="w-2 h-2 bg-green-500 rounded-sm border border-green-700"
              ></div>
              <div v-else class="w-2 h-2 bg-gray-500 rounded-sm border border-gray-700"></div>
              <div class="text-gray-700">{{ record.is_active ? '可用' : '已禁用' }}</div>
            </a-space>
          </template>
        </a-table-column>
        <a-table-column
          title="创建时间"
          data-index="created_at"
          header-cell-class="!bg-gray-200 text-gray-700"
          cell-class="bg-transparent text-gray-700"
        >
          <template #cell="{ record }">
            {{ dayjs(record.created_at * 1000).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
        </a-table-column>
        <a-table-column
          title="备注"
          :width="400"
          data-index="remark"
          header-cell-class="!bg-gray-200 text-gray-700"
          cell-class="bg-transparent text-gray-700"
        >
          <template #cell="{ record }">
            <div class="line-clamp-1">{{ record.remark }}</div>
          </template>
        </a-table-column>
        <a-table-column
          title="操作"
          data-index="operator"
          header-cell-class="rounded-tr-lg !bg-gray-200 text-gray-700"
          cell-class="bg-transparent text-gray-700 !h-[40px]"
          :width="100"
        >
          <template #cell="{ record, rowIndex }">
            <a-space :size="0">
              <template #split>
                <a-divider direction="vertical" />
              </template>
              <a-switch
                size="small"
                type="round"
                :model-value="record.is_active"
                @change="(value: any) => onToggleActive(record.id, rowIndex, value)"
              />
              <a-dropdown position="br">
                <a-button type="text" size="mini" class="!text-gray-700">
                  <template #icon>
                    <icon-more />
                  </template>
                </a-button>
                <template #content>
                  <a-doption
                    @click="
                      () => {
                        updateApiKeyId = record.id
                        updateApiKeyIsActive = record.is_active
                        updateApiKeyRemark = record.remark
                        createOrUpdateApiKeyModalVisible = true
                      }
                    "
                  >
                    重命名
                  </a-doption>
                  <a-doption
                    class="!text-red-700"
                    @click="
                      () =>
                        handleDeleteApiKey(record.id, async () => {
                          await loadApiKeys(false, req)
                        })
                    "
                  >
                    删除
                  </a-doption>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>
    <!-- 新增/重命名模态窗 -->
    <create-or-update-api-key-modal
      v-model:visible="createOrUpdateApiKeyModalVisible"
      v-model:api_key_id="updateApiKeyId"
      v-model:is_active="updateApiKeyIsActive"
      v-model:remark="updateApiKeyRemark"
      @update:visible="(value) => emits('update:create_api_key', value)"
      :callback="async () => await loadApiKeys(false, req)"
    />
  </div>
</template>

<style scoped></style>
