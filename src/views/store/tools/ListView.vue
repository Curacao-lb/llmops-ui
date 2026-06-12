<script setup lang="ts">
  import { getCategories, getBuiltinTools } from '@/services/buildin-tools'
  import { onMounted, ref } from 'vue'
  import dayjs from 'dayjs'
  import { apiPrefix } from '@/config'
  import { computed } from 'vue'

  // 声明变量
  const categories = ref<Array<any>>([])
  const providers = ref<Array<any>>([])
  const getBuiltinToolsLoading = ref<boolean>(true)
  const showIdx = ref<number>(-1)
  const search_word = ref<string>('')
  const category = ref<string>('all')
  const filterProviders = computed(() => {
    return providers.value.filter((item: any) => {
      // 分别检索分类信息+搜索词，只有同时符合的时候才返回数据
      const matchCategory = category.value === 'all' || item.category === category.value
      const matchSearchWord =
        search_word.value === '' || item.label.toLowerCase().includes(search_word.value)

      return matchCategory && matchSearchWord
    })
  })

  onMounted(async () => {
    // 拦截器已拆包，这里直接拿到里层数组
    categories.value = await getCategories()
  })

  onMounted(async () => {
    providers.value = await getBuiltinTools()
    getBuiltinToolsLoading.value = false
  })
</script>

<template>
  <a-spin :loading="getBuiltinToolsLoading" class="block h-full w-full">
    <!-- 顶层标题+创建按钮 -->
    <div class="flex items-center justify-between mb-6">
      <!-- 左侧标题 -->
      <div class="flex items-center gap-2">
        <a-avatar :size="32" class="bg-blue-700">
          <icon-common :size="18" />
        </a-avatar>
        <div class="text-lg font-medium text-gray-900">插件广场</div>
      </div>
      <!-- 创建按钮 -->
      <router-link :to="{ name: 'space-tools-list', query: { create_type: 'tool' } }">
        <a-button type="primary" class="rounded-lg">创建自定义插件</a-button>
      </router-link>
    </div>
    <!-- 插件分类+搜索框 -->
    <div class="flex items-center justify-between mb-6">
      <!-- 左侧分类 -->
      <div class="flex items-center gap-2">
        <a-button
          :type="category === 'all' ? 'secondary' : 'text'"
          class="rounded-lg text-gray-700! px-3"
          @click="category = 'all'"
        >
          全部
        </a-button>
        <a-button
          v-for="item in categories"
          :key="item.category"
          :type="category === item.category ? 'secondary' : 'text'"
          class="rounded-lg text-gray-700! px-3"
          @click="category = item.category"
        >
          {{ item.name }}
        </a-button>
      </div>
      <!-- 右侧搜索 -->
      <a-input-search
        v-model="search_word"
        placeholder="请输入插件名称"
        class="w-[240px] bg-white rounded-lg border-gray-300"
      />
    </div>
    <!-- 底部插件列表 -->
    <a-row :gutter="[20, 20]" class="flex-1">
      <!-- 有数据的UI状态 -->
      <a-col v-for="(builtinTool, idx) in filterProviders" :key="builtinTool.name" :span="6">
        <a-card hoverable class="cursor-pointer rounded-lg" @click="showIdx = idx">
          <!-- 顶部提供商名称 -->
          <div class="flex items-center gap-3 mb-3">
            <!-- 左侧图标 -->
            <a-avatar
              :size="40"
              shape="square"
              :style="{ backgroundColor: builtinTool.background }"
            >
              <img
                :src="`${apiPrefix}/builtin-tools/${builtinTool.name}/icon`"
                :alt="builtinTool.name"
              />
            </a-avatar>
            <!-- 右侧工具信息 -->
            <div class="flex flex-col">
              <div class="text-base text-gray-900 font-bold">{{ builtinTool.label }}</div>
              <div class="text-xs text-gray-500 line-clamp-1">
                提供商 {{ builtinTool.name }} · {{ builtinTool.tools.length }} 插件
              </div>
            </div>
          </div>
          <!-- 提供商的描述信息 -->
          <div class="leading-[18px] text-gray-500 h-[72px] line-clamp-4 mb-2">
            {{ builtinTool.description }}
          </div>
          <!-- 提供商的发布信息 -->
          <div class="flex items-center gap-1.5">
            <a-avatar :size="18" class="bg-blue-700">
              <icon-user />
            </a-avatar>
            <div class="text-xs text-gray-400">
              LLM · 发布时间
              {{ dayjs(builtinTool.created_at * 1000).format('MM-DD HH:mm') }}
            </div>
          </div>
        </a-card>
      </a-col>
      <!-- 没数据的UI状态 -->
      <a-col v-if="providers.length === 0" :span="24">
        <a-empty
          description="没有可用的内置插件"
          class="h-[400px] flex flex-col items-center justify-center"
        />
      </a-col>
    </a-row>
  </a-spin>
</template>

<style scroped></style>
