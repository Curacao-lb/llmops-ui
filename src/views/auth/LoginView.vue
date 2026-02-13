<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAccountStore } from '@/stores/account'

  const router = useRouter()
  const accountStore = useAccountStore()

  const form = ref({
    username: '',
    password: '',
  })

  const handleLogin = () => {
    // 模拟登录
    accountStore.login(
      {
        id: '1',
        username: form.value.username,
        email: `${form.value.username}@example.com`,
      },
      'mock-token-123'
    )
    router.push('/')
  }
</script>

<template>
  <div class="flex items-center justify-center h-screen bg-gray-100">
    <a-card class="w-96" title="登录">
      <a-form :model="form" @submit="handleLogin">
        <a-form-item label="用户名">
          <a-input v-model="form.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="密码">
          <a-input-password v-model="form.password" placeholder="请输入密码" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" long>登录</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>
