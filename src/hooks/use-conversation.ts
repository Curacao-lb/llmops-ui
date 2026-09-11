import { ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  deleteConversation,
  deleteMessage,
  getConversationMessages,
  updateConversationIsPinned,
  updateConversationName,
} from '@/services/conversation'
import type { GetConversationMessagesWithPageResponse } from '@/models/conversation'

export const useGetConversationMessagesWithPage = () => {
  const loading = ref(false)
  const messages = ref<GetConversationMessagesWithPageResponse['data']['list']>([])
  const created_at = ref(0)
  const paginator = ref({ current_page: 1, page_size: 5, total_page: 0, total_record: 0 })

  const loadConversationMessagesWithPage = async (conversation_id: string, init = false) => {
    if (init) {
      paginator.value = { current_page: 1, page_size: 5, total_page: 0, total_record: 0 }
      created_at.value = 0
    } else if (paginator.value.current_page > paginator.value.total_page) {
      return
    }

    try {
      loading.value = true
      const resp = await getConversationMessages(conversation_id, {
        current_page: 1,
        page_size: paginator.value.page_size,
        created_at: created_at.value,
      })
      const data = resp.data
      paginator.value = data.paginator
      if (paginator.value.current_page <= paginator.value.total_page) {
        paginator.value.current_page += 1
      }
      if (init) messages.value = data.list
      else messages.value.push(...data.list)

      const oldest = data.list[data.list.length - 1]?.created_at
      if (oldest !== undefined) created_at.value = Math.max(0, oldest - 1)
    } finally {
      loading.value = false
    }
  }

  return { loading, messages, paginator, loadConversationMessagesWithPage }
}

export const useDeleteConversation = () => {
  const handleDeleteConversation = (conversation_id: string, callback?: () => void) => {
    Modal.warning({
      title: '要删除该会话吗？',
      content: '删除后该会话下的聊天记录将无法恢复。',
      hideCancel: false,
      onOk: async () => {
        const resp = await deleteConversation(conversation_id)
        Message.success(resp.message)
        callback?.()
      },
    })
  }
  return { handleDeleteConversation }
}

export const useDeleteMessage = () => {
  const loading = ref(false)
  const handleDeleteMessage = async (conversation_id: string, message_id: string) => {
    try {
      loading.value = true
      await deleteMessage(conversation_id, message_id)
    } finally {
      loading.value = false
    }
  }
  return { loading, handleDeleteMessage }
}

export const useUpdateConversationName = () => {
  const loading = ref(false)
  const handleUpdateConversationName = async (conversation_id: string, name: string) => {
    try {
      loading.value = true
      const resp = await updateConversationName(conversation_id, name)
      Message.success(resp.message)
    } finally {
      loading.value = false
    }
  }
  return { loading, handleUpdateConversationName }
}

export const useUpdateConversationIsPinned = () => {
  const loading = ref(false)
  const handleUpdateConversationIsPinned = async (
    conversation_id: string,
    is_pinned: boolean,
    callback?: () => void
  ) => {
    try {
      loading.value = true
      const resp = await updateConversationIsPinned(conversation_id, is_pinned)
      Message.success(resp.message)
      callback?.()
    } finally {
      loading.value = false
    }
  }
  return { loading, handleUpdateConversationIsPinned }
}
