<script setup lang="ts">
  import CodeHighLight from '@/components/CodeHighLight.vue'
  import {
    blockApiOutput,
    blockApiShell,
    streamApiOutput,
    streamApiShell,
  } from '@/views/open/quick-start'
</script>

<template>
  <div class="pb-6">
    <div class="bg-white p-6 rounded-lg h-[calc(100vh-160px)] overflow-scroll scrollbar-w-none">
      <h2 class="text-base text-gray-700 font-bold mb-4">概览</h2>
      <p class="text-gray-700 mb-4">
        开放 API 是本平台面向开发者提供的技术交互能力，通过 API
        可以更高效、更灵活地将平台中的模型、工作流、知识库与扩展插件等能力接入到企业现有业务，让定制化
        Agent 更加精确、高效和智能。
      </p>
      <h2 class="text-base text-gray-900 font-bold mb-4">准备工作</h2>
      <p class="text-gray-700 mb-4">
        在开始之前，您需要在「密钥」页面创建个人访问令牌（API 密钥），并在个人空间中完成 Agent
        应用的创建与发布。
      </p>
      <h2 class="text-base text-gray-900 font-bold mb-4">基础使用</h2>
      <a-tabs type="text">
        <a-tab-pane key="block" title="非流式 Chat">
          <p class="text-gray-700 mb-4">请求 CURL</p>
          <code-high-light language="shell">{{ blockApiShell }}</code-high-light>
          <p class="text-gray-700 mb-4">返回结果示例</p>
          <code-high-light language="json">{{ blockApiOutput }}</code-high-light>
        </a-tab-pane>
        <a-tab-pane key="stream" title="流式 Chat">
          <p class="text-gray-700 mb-4">请求 CURL</p>
          <code-high-light language="shell">{{ streamApiShell }}</code-high-light>
          <p class="text-gray-700 mb-4">返回结果示例</p>
          <code-high-light language="text">{{ streamApiOutput }}</code-high-light>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<style scoped></style>
