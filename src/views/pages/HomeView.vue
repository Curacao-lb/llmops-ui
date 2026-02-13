<script setup lang="ts">
  import { useAccountStore } from '@/stores/account'

  const accountStore = useAccountStore()
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">欢迎回来，{{ accountStore.username || '访客' }}</h1>
    <a-card title="首页">
      <p>这是首页内容</p>
    </a-card>
  </div>
</template>
