<script setup lang="ts">
import { ref } from 'vue'
import { Message } from '@arco-design/web-vue'

// 轻量代码展示组件（不引入 highlight.js 依赖），提供复制能力
const props = defineProps({
  language: { type: String, default: '', required: false },
})

const codeElement = ref<HTMLElement | null>(null)

const copyCode = async () => {
  const text = codeElement.value?.textContent ?? ''
  try {
    await navigator.clipboard.writeText(text)
    Message.success('复制成功')
  } catch (err) {
    Message.error(String(err))
  }
}
</script>

<template>
  <div class="relative mb-4 group">
    <a-button
      size="mini"
      class="absolute right-2 top-2 z-10 rounded opacity-0 group-hover:opacity-100 transition-all"
      @click="copyCode"
    >
      <template #icon>
        <icon-copy />
      </template>
    </a-button>
    <pre
      class="m-0 p-4 rounded-lg bg-[#1e1e1e] overflow-x-auto scrollbar-w-none"
    ><code ref="codeElement" :class="`language-${props.language} whitespace-pre text-sm text-gray-100 leading-relaxed`"><slot></slot></code></pre>
  </div>
</template>

<style scoped></style>
