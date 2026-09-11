<script setup lang="ts">
  import { ref, watch } from 'vue'
  import type { Form, ValidatedError } from '@arco-design/web-vue'
  import { useUpdateConversationName } from '@/hooks/use-conversation'

  const props = defineProps({
    conversation_id: { type: String, default: '' },
    visible: { type: Boolean, required: true },
    success_callback: { type: Function, required: false },
  })
  const emits = defineEmits(['update:visible', 'update:conversation_id'])
  const form = ref({ name: '' })
  const formRef = ref<InstanceType<typeof Form>>()
  const { loading, handleUpdateConversationName } = useUpdateConversationName()

  const hide = () => emits('update:visible', false)
  const submit = async ({ errors }: { errors?: Record<string, ValidatedError> }) => {
    if (errors) return
    await handleUpdateConversationName(props.conversation_id, form.value.name)
    props.success_callback?.(props.conversation_id, form.value.name)
    hide()
  }

  watch(
    () => props.visible,
    (visible) => {
      formRef.value?.resetFields()
      if (!visible) {
        form.value = { name: '' }
        emits('update:conversation_id', '')
      }
    }
  )
</script>

<template>
  <a-modal :visible="props.visible" hide-title :footer="false" @cancel="hide">
    <div class="flex items-center justify-between">
      <div class="text-lg font-bold text-gray-700">重命名会话</div>
      <a-button type="text" @click="hide"><icon-close /></a-button>
    </div>
    <a-form ref="formRef" :model="form" layout="vertical" class="pt-5" @submit="submit">
      <a-form-item
        field="name"
        label="会话名称"
        :rules="[{ required: true, message: '会话名称不能为空' }]"
      >
        <a-input v-model="form.name" placeholder="请输入会话名称" />
      </a-form-item>
      <div class="flex justify-end gap-3">
        <a-button @click="hide">取消</a-button>
        <a-button type="primary" html-type="submit" :loading="loading">确认</a-button>
      </div>
    </a-form>
  </a-modal>
</template>
