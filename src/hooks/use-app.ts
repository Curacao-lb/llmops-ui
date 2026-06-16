import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import { copyApp, createApp, deleteApp, getApp, getAppsWithPage, updateApp } from '@/services/app'
import type {
  CreateAppRequest,
  GetAppsWithPageResponse,
  UpdateAppRequest,
} from '@/models/app'

export const useGetApp = () => {
  const loading = ref(false)
  const app = ref<Record<string, any>>({})

  const loadApp = async (app_id: string) => {
    try {
      loading.value = true
      const resp = await getApp(app_id)
      app.value = resp.data
    } finally {
      loading.value = false
    }
  }

  return { loading, app, loadApp }
}

export const useGetAppsWithPage = () => {
  const loading = ref(false)
  const apps = ref<GetAppsWithPageResponse['data']['list']>([])
  const defaultPaginator = {
    current_page: 1,
    page_size: 20,
    total_page: 0,
    total_record: 0,
  }
  const paginator = ref({ ...defaultPaginator })

  const loadApps = async (
    init: boolean = false,
    search_word: string = '',
    status: string = '',
    mode: number = -1,
  ) => {
    if (init) {
      paginator.value = { ...defaultPaginator }
    } else if (paginator.value.current_page > paginator.value.total_page) {
      return
    }

    try {
      loading.value = true
      const resp = await getAppsWithPage({
        current_page: paginator.value.current_page,
        page_size: paginator.value.page_size,
        search_word,
        status,
        mode,
      })
      const data = resp.data

      paginator.value = data.paginator

      if (paginator.value.current_page <= paginator.value.total_page) {
        paginator.value.current_page += 1
      }

      if (init) {
        apps.value = data.list
      } else {
        apps.value.push(...data.list)
      }
    } finally {
      loading.value = false
    }
  }

  return { loading, apps, paginator, loadApps }
}

export const useCreateApp = () => {
  const router = useRouter()
  const loading = ref(false)

  const handleCreateApp = async (req: CreateAppRequest) => {
    try {
      loading.value = true
      const resp = await createApp(req)
      Message.success('新增Agent应用成功')
      await router.push({
        name: 'space-apps-detail',
        params: { app_id: resp.data.id },
      })
    } finally {
      loading.value = false
    }
  }

  return { loading, handleCreateApp }
}

export const useUpdateApp = () => {
  const loading = ref(false)

  const handleUpdateApp = async (app_id: string, req: UpdateAppRequest) => {
    try {
      loading.value = true
      const resp = await updateApp(app_id, req)
      Message.success(resp.message)
    } finally {
      loading.value = false
    }
  }

  return { loading, handleUpdateApp }
}

export const useCopyApp = () => {
  const router = useRouter()
  const loading = ref(false)

  const handleCopyApp = async (app_id: string) => {
    try {
      loading.value = true
      const resp = await copyApp(app_id)
      Message.success('创建应用副本成功')
      await router.push({ name: 'space-apps-detail', params: { app_id: resp.data.id } })
    } finally {
      loading.value = false
    }
  }

  return { loading, handleCopyApp }
}

export const useDeleteApp = () => {
  const handleDeleteApp = async (app_id: string, callback?: () => void) => {
    Modal.warning({
      title: '要删除该应用吗?',
      content:
        '删除应用后，发布的WebApp、开放API以及关联的社交媒体平台均无法使用该Agent应用，如果需要暂停应用，可使用取消发布功能。',
      hideCancel: false,
      onOk: async () => {
        try {
          const resp = await deleteApp(app_id)
          Message.success(resp.message)
        } finally {
          callback && callback()
        }
      },
    })
  }

  return { handleDeleteApp }
}
