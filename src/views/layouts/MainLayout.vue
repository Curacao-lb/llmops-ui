<script setup lang="ts">
  import { ref } from 'vue'

  const collapsed = ref(false)
</script>

<template>
  <a-layout class="h-screen">
    <a-layout-sider :collapsed="collapsed" collapsible @collapse="collapsed = !collapsed">
      <div class="logo p-4 text-white text-center font-bold">LLMOPS</div>
      <a-menu :default-selected-keys="['1']" theme="dark">
        <a-menu-item key="1">
          <router-link to="/">首页</router-link>
        </a-menu-item>
        <a-menu-item key="2">
          <router-link to="/space">空间</router-link>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-content class="p-6">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
  .logo {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
