<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useAuthorize } from '@/hooks/use-oauth'
  import { useGetCurrentUser } from '@/hooks/use-account'
  import { useAccountStore } from '@/stores/account'
  import { useCredentialStore } from '@/stores/credential'

  const route = useRoute()
  const router = useRouter()
  const accountStore = useAccountStore()
  const credentialStore = useCredentialStore()
  const { authorization, handleAuthorize } = useAuthorize()
  const { current_user, loadCurrentUser } = useGetCurrentUser()

  onMounted(async () => {
    try {
      await handleAuthorize(String(route.params?.provider_name), String(route.query?.code ?? ''))
      credentialStore.update(authorization.value)

      // OAuth 授权接口只返回登录凭证，需使用凭证继续获取当前账号信息。
      await loadCurrentUser()
      accountStore.update(current_user.value)

      await router.replace({ path: '/home' })
    } catch {
      accountStore.clear()
      credentialStore.clear()
      await router.replace({ path: '/auth/login' })
    }
  })
</script>

<template>
  <div class="w-full min-h-screen flex items-center justify-center bg-white">
    <a-spin tip="第三方授权登录中..."></a-spin>
  </div>
</template>

<style scoped></style>
