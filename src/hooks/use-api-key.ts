import { ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import type { BasePaginatorRequest } from '@/models/base'
import type {
  CreateApiKeyRequest,
  GetApiKeysWithPageResponse,
  UpdateApiKeyRequest,
} from '@/models/api-key'
import {
  createApiKey,
  deleteApiKey,
  getApiKeysWithPage,
  updateApiKey,
  updateApiKeyIsActive,
} from '@/services/api-key'

// 获取 API 密钥分页列表
export const useGetApiKeysWithPage = () => {
  const loading = ref(false)
  const api_keys = ref<GetApiKeysWithPageResponse['data']['list']>([])
  const defaultPaginator = {
    current_page: 1,
    page_size: 20,
    total_page: 0,
    total_record: 0,
  }
  const paginator = ref({ ...defaultPaginator })

  const loadApiKeys = async (
    init: boolean = false,
    req: BasePaginatorRequest = { current_page: 1, page_size: 20 }
  ) => {
    if (!init && paginator.value.current_page > paginator.value.total_page) {
      return
    }

    try {
      loading.value = true
      const resp = await getApiKeysWithPage(req)
      const data = resp.data

      paginator.value = data.paginator
      api_keys.value = data.list
    } finally {
      loading.value = false
    }
  }

  return { loading, api_keys, paginator, loadApiKeys }
}

// 删除 API 密钥
export const useDeleteApiKey = () => {
  const handleDeleteApiKey = (api_key_id: string, callback?: () => void) => {
    Modal.warning({
      title: '要删除该 API 密钥吗?',
      content:
        '删除密钥后，将无法使用该密钥访问个人空间中的所有应用，并且无法恢复，如需临时关闭请使用禁用功能。',
      hideCancel: false,
      onOk: async () => {
        try {
          const resp = await deleteApiKey(api_key_id)
          Message.success(resp.message)
        } finally {
          callback && callback()
        }
      },
    })
  }

  return { handleDeleteApiKey }
}

// 修改 API 密钥
export const useUpdateApiKey = () => {
  const loading = ref(false)

  const handleUpdateApiKey = async (api_key_id: string, req: UpdateApiKeyRequest) => {
    try {
      loading.value = true
      const resp = await updateApiKey(api_key_id, req)
      Message.success(resp.message)
    } finally {
      loading.value = false
    }
  }

  return { loading, handleUpdateApiKey }
}

// 修改 API 密钥激活状态
export const useUpdateApiKeyIsActive = () => {
  const loading = ref(false)

  const handleUpdateApiKeyIsActive = async (
    api_key_id: string,
    is_active: boolean,
    callback?: () => void
  ) => {
    try {
      loading.value = true
      const resp = await updateApiKeyIsActive(api_key_id, is_active)
      Message.success(resp.message)
    } finally {
      loading.value = false
      callback && callback()
    }
  }

  return { loading, handleUpdateApiKeyIsActive }
}

// 创建 API 密钥
export const useCreateApiKey = () => {
  const loading = ref(false)

  const handleCreateApiKey = async (req: CreateApiKeyRequest) => {
    try {
      loading.value = true
      const resp = await createApiKey(req)
      Message.success(resp.message)
    } finally {
      loading.value = false
    }
  }

  return { loading, handleCreateApiKey }
}
