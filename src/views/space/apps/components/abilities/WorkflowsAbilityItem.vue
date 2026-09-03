<script setup lang="ts">
  import { nextTick, type PropType, ref, watch } from 'vue'
  import { cloneDeep, isEqual } from 'lodash'
  import { Message } from '@arco-design/web-vue'
  import { useUpdateDraftAppConfig } from '@/hooks/use-app'
  import { useGetWorkflowsWithPage } from '@/hooks/use-workflow'

  type Workflow = {
    id: string
    name: string
    icon: string
    description: string
  }

  const props = defineProps({
    app_id: { type: String, default: '', required: true },
    workflows: {
      type: Array as PropType<Workflow[]>,
      default: () => [],
      required: true,
    },
  })
  const emits = defineEmits(['update:workflows'])

  const { loading: updateDraftAppConfigLoading, handleUpdateDraftAppConfig } =
    useUpdateDraftAppConfig()
  const { loading, paginator, workflows: apiWorkflows, loadWorkflows } = useGetWorkflowsWithPage()

  const workflowsModalVisible = ref(false)
  const isWorkflowsInit = ref(false)
  const activateWorkflows = ref<Workflow[]>([])
  const originWorkflows = ref<Workflow[]>([])

  // 滚动到底部时加载更多工作流
  const handleScroll = async (event: UIEvent) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target as HTMLElement

    if (scrollTop + clientHeight >= scrollHeight - 10) {
      if (loading.value) return
      await loadWorkflows('', 'published')
    }
  }

  // 判断激活的工作流是否与初始数据一致
  const isWorkflowsModified = () => {
    return isEqual(activateWorkflows.value, originWorkflows.value)
  }

  // 取消并关闭模态窗
  const handleCancelWorkflowsModal = () => {
    workflowsModalVisible.value = false
    activateWorkflows.value = originWorkflows.value
    isWorkflowsInit.value = false
  }

  // 工作流选择处理器
  const handleSelectWorkflow = (idx: number) => {
    const workflow = apiWorkflows.value[idx]
    if (!workflow) return

    // 已选中则移除，否则添加
    if (activateWorkflows.value.some((item) => item.id === workflow.id)) {
      activateWorkflows.value = activateWorkflows.value.filter((item) => item.id !== workflow.id)
    } else {
      if (activateWorkflows.value.length >= 5) {
        Message.warning('关联工作流已超过5个，无法继续关联')
        return
      }
      activateWorkflows.value.push({
        id: workflow.id,
        name: workflow.name,
        icon: workflow.icon,
        description: workflow.description,
      })
    }
  }

  // 提交更新关联工作流
  const handleSubmitWorkflows = async () => {
    try {
      await handleUpdateDraftAppConfig(props.app_id, {
        workflows: activateWorkflows.value.map((item) => item.id),
      })

      originWorkflows.value = activateWorkflows.value
      await nextTick()

      emits('update:workflows', activateWorkflows.value)
      handleCancelWorkflowsModal()
    } catch {
      /* empty */
    }
  }

  // 删除指定关联工作流
  const handleDeleteWorkflow = async (idx: number) => {
    const newWorkflows = [...props.workflows]
    newWorkflows.splice(idx, 1)

    await handleUpdateDraftAppConfig(props.app_id, {
      workflows: newWorkflows.map((item) => item.id),
    })

    isWorkflowsInit.value = false
    emits('update:workflows', newWorkflows)
  }

  // 监听草稿配置关联的工作流列表
  watch(
    () => props.workflows,
    (newValue) => {
      if (!isWorkflowsInit.value || !isWorkflowsModified()) {
        if (newValue && newValue.length > 0) {
          const initData = props.workflows.map((workflow) => ({
            id: workflow.id,
            name: workflow.name,
            icon: workflow.icon,
            description: workflow.description,
          }))
          activateWorkflows.value = cloneDeep(initData)
          originWorkflows.value = cloneDeep(initData)
          isWorkflowsInit.value = true
        }
      }
    },
    { immediate: true, deep: true }
  )

  // 监听工作流模态窗显示or隐藏
  watch(
    () => workflowsModalVisible.value,
    async (newValue) => {
      if (newValue) {
        await loadWorkflows('', 'published', true)
      } else {
        apiWorkflows.value.splice(0, apiWorkflows.value.length)
      }
    }
  )
</script>

<template>
  <div class="">
    <a-collapse-item key="workflows" class="app-ability-item">
      <template #header>
        <div class="text-gray-700 font-bold">工作流</div>
      </template>
      <template #extra>
        <a-button
          size="mini"
          type="text"
          class="!text-gray-700"
          @click.stop="workflowsModalVisible = true"
        >
          <template #icon>
            <icon-plus />
          </template>
        </a-button>
      </template>
      <!-- 已关联工作流列表 -->
      <div v-if="props.workflows?.length > 0" class="flex flex-col gap-1">
        <div
          v-for="(workflow, idx) in props.workflows"
          :key="workflow.id"
          class="flex items-center justify-between bg-white p-3 rounded-lg cursor-pointer hover:shadow-sm group"
        >
          <!-- 左侧工作流信息 -->
          <div class="flex items-center gap-2">
            <a-avatar
              :size="36"
              shape="square"
              class="rounded flex-shrink-0"
              :image-url="workflow.icon"
            />
            <div class="flex flex-col flex-1 gap-1 h-9">
              <div class="text-gray-700 font-bold leading-[18px] line-clamp-1 break-all">
                {{ workflow.name }}
              </div>
              <div class="text-gray-500 text-xs line-clamp-1 break-all">
                {{ workflow.description }}
              </div>
            </div>
          </div>
          <!-- 右侧删除按钮 -->
          <a-button
            size="mini"
            type="text"
            class="hidden group-hover:block flex-shrink-0 ml-2 !text-red-700 rounded"
            @click="async () => await handleDeleteWorkflow(idx)"
          >
            <template #icon>
              <icon-delete />
            </template>
          </a-button>
        </div>
      </div>
      <div v-else class="text-xs text-gray-500 leading-[22px]">
        工作流支持通过可视化的方式，对插件、大语言模型、代码块等功能进行组合，从而实现复杂、稳定的业务流程编排，例如旅行规划、报告分析等。
      </div>
    </a-collapse-item>
    <!-- 工作流选择模态窗 -->
    <a-modal
      :visible="workflowsModalVisible"
      hide-title
      :footer="false"
      :width="400"
      class="workflows-modal"
      modal-class="h-[calc(100vh-32px)] right-4"
      @cancel="handleCancelWorkflowsModal"
    >
      <!-- 顶部标题 -->
      <div class="flex items-center justify-between mb-6">
        <div class="text-lg font-bold text-gray-700">选择关联工作流</div>
        <a-button
          type="text"
          class="!text-gray-700"
          size="small"
          @click="handleCancelWorkflowsModal"
        >
          <template #icon>
            <icon-close />
          </template>
        </a-button>
      </div>
      <!-- 中间工作流容器 -->
      <div class="h-[calc(100vh-180px)] mb-4 overflow-scroll scrollbar-w-none">
        <a-spin
          :loading="loading"
          class="block h-full w-full scrollbar-w-none overflow-scroll"
          @scroll="handleScroll"
        >
          <div class="flex flex-col gap-2">
            <!-- 有数据UI状态 -->
            <div
              v-for="(workflow, idx) in apiWorkflows"
              :key="workflow.id"
              :class="`flex items-center gap-2 border px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-700 ${activateWorkflows.some((item) => item.id === workflow.id) ? 'bg-blue-50 border-blue-700' : ''}`"
              @click="() => handleSelectWorkflow(idx)"
            >
              <a-avatar
                :size="24"
                shape="square"
                class="flex-shrink-0 rounded"
                :image-url="workflow.icon"
              />
              <div class="line-clamp-1 text-gray-500 flex-1">{{ workflow.name }}</div>
            </div>
            <!-- 无数据UI状态 -->
            <a-empty
              v-if="apiWorkflows.length === 0"
              description="没有可用的工作流"
              class="h-[400px] flex flex-col items-center justify-center"
            />
          </div>
          <!-- 加载器 -->
          <a-row v-if="paginator.total_page >= 2">
            <a-col
              v-if="paginator.current_page <= paginator.total_page"
              :span="24"
              class="!text-center"
            >
              <a-space class="my-4">
                <a-spin />
                <div class="text-gray-400">加载中</div>
              </a-space>
            </a-col>
            <a-col v-else :span="24" class="!text-center">
              <div class="text-gray-400 my-4">数据已加载完成</div>
            </a-col>
          </a-row>
        </a-spin>
      </div>
      <!-- 底部选中工作流及按钮 -->
      <div class="flex items-center justify-between">
        <div class="">{{ activateWorkflows.length }} 个工作流被选中</div>
        <a-space :size="12">
          <a-button class="rounded-lg" @click="handleCancelWorkflowsModal">取消</a-button>
          <a-button
            :loading="updateDraftAppConfigLoading"
            type="primary"
            class="rounded-lg"
            @click="handleSubmitWorkflows"
          >
            添加
          </a-button>
        </a-space>
      </div>
    </a-modal>
  </div>
</template>

<style>
  .workflows-modal {
    .arco-modal-wrapper {
      text-align: right;
    }
  }
</style>
