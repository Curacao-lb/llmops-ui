<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useGetPublishedConfig, useRegenerateWebAppToken } from '@/hooks/use-app'

  const route = useRoute()
  const router = useRouter()
  const appId = String(route.params.app_id)
  const { loading, published_config, loadPublishedConfig } = useGetPublishedConfig()
  const {
    loading: regenerateLoading,
    token,
    handleRegenerateWebAppToken,
  } = useRegenerateWebAppToken()

  const isPublished = computed(() => published_config.value?.web_app?.status === 'published')
  const webAppUrl = computed(() => {
    if (!isPublished.value) return ''
    return (
      window.location.origin +
      router.resolve({
        name: 'web-apps-index',
        params: { token: published_config.value.web_app.token },
      }).href
    )
  })

  const regenerate = async () => {
    await handleRegenerateWebAppToken(appId)
    published_config.value.web_app.token = token.value
  }

  onMounted(() => loadPublishedConfig(appId))
</script>

<template>
  <div class="h-full overflow-auto bg-white px-6 py-5">
    <a-alert class="mb-5">
      如应用访问链接意外泄露，请及时重新生成访问凭证，避免资源出现异常消耗。
    </a-alert>

    <a-spin :loading="loading" class="w-full">
      <div class="border border-gray-200 rounded-xl overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
          <div>
            <div class="text-base font-semibold text-gray-800">网页版 WebApp</div>
            <div class="text-sm text-gray-500 mt-1">通过浏览器访问应用并进行对话。</div>
          </div>
          <a-tag :color="isPublished ? 'blue' : 'gray'">
            {{ isPublished ? '已发布' : '未发布' }}
          </a-tag>
        </div>

        <div class="p-5 flex items-center gap-3">
          <a-input :model-value="webAppUrl || '应用未发布，无可访问链接'" readonly class="flex-1" />
          <a-button :disabled="!isPublished" :loading="regenerateLoading" @click="regenerate">
            重新生成
          </a-button>
          <a-button type="primary" :disabled="!isPublished">
            <a :href="webAppUrl" target="_blank" rel="noopener noreferrer">立即访问</a>
          </a-button>
        </div>
      </div>
    </a-spin>
  </div>
</template>
