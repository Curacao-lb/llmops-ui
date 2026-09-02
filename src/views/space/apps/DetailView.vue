<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { useGetDraftAppConfig } from '@/hooks/use-app'
  import ModelConfig from './components/ModelConfig.vue'
  import PresetPromptTextArea from './components/PresetPromptTextArea.vue'
  import AgentAppAbility from './components/AgentAppAbility.vue'
  import PreViewDebugHeader from './components/PreViewDebugHeader.vue'
  import PreviewDebugChat from './components/PreviewDebugChat.vue'

  // 应用基础信息由父级 AppLayoutView 通过 props 传入
  defineProps({
    app: {
      type: Object,
      default: () => ({}),
    },
  })

  const route = useRoute()
  const appId = route.params.app_id as string

  // 应用草稿配置
  const { draftAppConfigForm, loadDraftAppConfig } = useGetDraftAppConfig()

  onMounted(async () => {
    await loadDraftAppConfig(appId)
  })
</script>

<template>
  <!-- 最外层容器，填满父级内容区高度 -->
  <div class="h-full">
    <!-- 内容区 -->
    <div class="flex flex-row h-full">
      <!-- 左侧的编排 -->
      <div class="w-2/3 bg-gray-50 h-full flex flex-col">
        <header
          class="flex items-center gap-4 h-16 border-b border-gray-200 px-7 shrink-0 text-xl text-gray-700"
        >
          <span>应用编排</span>
          <!-- 模型配置 -->
          <model-config
            :app_id="appId"
            v-model:model_config="draftAppConfigForm.model_config"
            v-model:dialog_round="draftAppConfigForm.dialog_round"
          />
        </header>
        <div class="flex flex-row flex-1 min-h-0">
          <!-- 人设与回复逻辑 -->
          <div class="flex-1 border-r border-gray-200 py-4">
            <preset-prompt-text-area
              :app_id="appId"
              v-model:preset_prompt="draftAppConfigForm.preset_prompt"
            />
          </div>
          <!-- 应用能力 -->
          <div class="flex-1 py-4">
            <agent-app-ability :app_id="appId" v-model:draft_app_config="draftAppConfigForm" />
          </div>
        </div>
      </div>
      <!-- 右侧调试与预览 -->
      <div class="flex flex-col w-1/3 bg-white h-full min-h-0">
        <!-- 预览与调试头部 -->
        <pre-view-debug-header
          :app_id="appId"
          :long_term_memory="draftAppConfigForm.long_term_memory"
        />
        <!-- 调试对话面板 -->
        <preview-debug-chat class="flex-1 min-h-0" :app="app" :app_config="draftAppConfigForm" />
      </div>
    </div>
  </div>
</template>
