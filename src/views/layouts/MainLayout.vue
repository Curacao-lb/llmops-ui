<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  import LayoutSidebar from './components/Sidebar.vue'

  const router = useRouter()
  const accountStore = useAccountStore()

  // 侧边栏折叠状态
  const collapsed = ref(false)
  // 账号设置模态窗显示状态
  const settingModalVisible = ref(false)

  // 退出登录：清理登录态后跳转到登录页
  const handleLogout = () => {
    accountStore.logout()
    router.push({ name: 'login' })
  }
</script>

<template>
  <a-layout has-sider class="h-full">
    <!-- 侧边栏 -->
    <a-layout-sider :width="240" class="min-h-screen bg-gray-50 p-2 shadow-none">
      <div class="bg-white h-full rounded-lg px-2 py-4 flex flex-col justify-between">
        <!-- 上半部分 -->
        <div class="">
          <!-- 顶部Logo -->
          <router-link to="/home" class="block h-9 w-full mb-5 hover transition-all rounded-lg">
            <div class="text-gray-700 hover:text-gray-900 flex items-center justify-center">
              <icon-logo class="h-full w-[40px]" />
              <p>不懂就问-AI应用开发平台</p>
            </div>
          </router-link>
          <!-- 创建AI应用按钮 -->
          <router-link :to="{ name: 'space', query: { create_type: 'app' } }">
            <a-button type="primary" long class="rounded-lg mb-4">
              <template #icon>
                <icon-plus />
              </template>
              创建 AI 应用
            </a-button>
          </router-link>
          <!-- 侧边栏导航 -->
          <LayoutSidebar />
        </div>
        <!-- 账号设置 -->
        <a-dropdown position="tl">
          <div
            class="flex items-center p-2 gap-2 transition-all cursor-pointer rounded-lg hover:bg-gray-100"
          >
            <a-space>
              <!-- 头像 -->
              <a-avatar
                :size="32"
                class="text-sm bg-blue-700"
                :image-url="accountStore.userInfo?.avatar"
              >
                {{ accountStore.username.charAt(0).toUpperCase() }}
              </a-avatar>
              <!-- 个人信息 -->
              <div class="flex flex-col">
                <div class="text-sm text-gray-900">{{ accountStore?.username }}</div>
                <div class="text-xs text-gray-500">
                  {{ accountStore.userInfo?.email ?? '123@123.com' }}
                </div>
              </div>
            </a-space>
          </div>
          <template #content>
            <a-doption @click="settingModalVisible = true">
              <template #icon>
                <icon-settings />
              </template>
              账号设置
            </a-doption>
            <a-doption @click="handleLogout">
              <template #icon>
                <icon-poweroff />
              </template>
              退出登录
            </a-doption>
          </template>
        </a-dropdown>
      </div>
    </a-layout-sider>
    <!-- 右侧内容 -->
    <a-layout-content>
      <router-view />
    </a-layout-content>
    <!-- 设置模态窗 -->
    <!-- <setting-modal v-model:visible="settingModalVisible" /> -->
  </a-layout>
</template>

<style scoped></style>
