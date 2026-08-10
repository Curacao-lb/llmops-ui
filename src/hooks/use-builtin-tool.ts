import { ref } from 'vue'
import { getBuiltinTool, getBuiltinTools, getCategories } from '@/services/buildin-tools'

// 获取内置工具分类列表
export const useGetCategories = () => {
  const loading = ref(false)
  const categories = ref<Record<string, any>>([])

  const loadCategories = async () => {
    try {
      loading.value = true
      const resp = await getCategories()
      categories.value = resp.data
    } finally {
      loading.value = false
    }
  }

  return { loading, categories, loadCategories }
}

// 获取内置工具详情
export const useGetBuiltinTool = () => {
  const loading = ref(false)
  const builtin_tool = ref<Record<string, any>>({})

  const loadBuiltinTool = async (provider_name: string, tool_name: string) => {
    try {
      loading.value = true
      const resp = await getBuiltinTool(provider_name, tool_name)
      builtin_tool.value = resp.data
    } finally {
      loading.value = false
    }
  }

  return { loading, builtin_tool, loadBuiltinTool }
}

// 获取内置工具列表
export const useGetBuiltinTools = () => {
  const loading = ref(false)
  const builtin_tools = ref<Record<string, any>>([])

  const loadBuiltinTools = async () => {
    try {
      loading.value = true
      const resp = await getBuiltinTools()
      builtin_tools.value = resp.data
    } finally {
      loading.value = false
    }
  }

  return { loading, builtin_tools, loadBuiltinTools }
}
