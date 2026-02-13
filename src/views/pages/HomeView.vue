<script setup lang="ts">
  import { useAccountStore } from '@/stores/account'
  import { api } from '@/api'
  import { Message } from '@arco-design/web-vue'

  const accountStore = useAccountStore()

  const testCORS = async () => {
    try {
      const result = await api.apps.debug('550e8400-e29b-41d4-a716-446655440000', {
        query: '你好，你是？',
      })
      Message.success('CORS 测试成功！')
      console.log('响应数据:', result)
    } catch (error) {
      Message.error('CORS 测试失败，请检查后端配置')
      console.error('错误:', error)
    }
  }
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">欢迎回来，{{ accountStore.username || '访客' }}</h1>
    <a-card title="首页">
      <p>这是首页内容</p>
      <a-button type="primary" @click="testCORS" class="mt-4">测试 CORS</a-button>
    </a-card>
  </div>
</template>
