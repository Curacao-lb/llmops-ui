import { ref } from 'vue'
import {
  getCurrentUser,
  updateAvatar,
  updateName,
  updatePassword,
  register,
  sendVerificationCode,
  forgetPassword,
} from '@/services/account'
import { Message } from '@arco-design/web-vue'
import type { GetCurrentUserResponse, RegisterAccountRequest } from '@/models/account'
import { encryptPassword } from '@/utils/password'

export const useGetCurrentUser = () => {
  const loading = ref(false)
  const current_user = ref<GetCurrentUserResponse['data']>({
    id: '',
    name: '',
    email: '',
    avatar: '',
    last_login_ip: '',
    last_login_at: 0,
    created_at: 0,
  })

  const loadCurrentUser = async () => {
    try {
      loading.value = true
      const resp = await getCurrentUser()
      current_user.value = resp.data
    } finally {
      loading.value = false
    }
  }

  return { loading, current_user, loadCurrentUser }
}

export const useUpdateAvatar = () => {
  const loading = ref(false)

  const handleUpdateAvatar = async (avatar: string) => {
    try {
      loading.value = true
      const resp = await updateAvatar(avatar)
      Message.success(resp.message)
    } finally {
      loading.value = false
    }
  }

  return { loading, handleUpdateAvatar }
}

export const useUpdateName = () => {
  const loading = ref(false)

  const handleUpdateName = async (name: string) => {
    try {
      loading.value = true
      await updateName(name)
    } finally {
      loading.value = false
    }
  }

  return { loading, handleUpdateName }
}

export const useUpdatePassword = () => {
  const loading = ref(false)

  const handleUpdatePassword = async (password: string) => {
    try {
      loading.value = true
      const resp = await updatePassword(encryptPassword(password))
      Message.success(resp.message)
    } finally {
      loading.value = false
    }
  }

  return { loading, handleUpdatePassword }
}

export const useRegister = () => {
  const loading = ref(false)
  const handlerRegister = async (req: RegisterAccountRequest) => {
    try {
      loading.value = true
      const resp = await register({
        ...req,
        password: encryptPassword(req.password),
        confirmPassword: encryptPassword(req.confirmPassword),
      })
      Message.success(resp.message)
    } finally {
      loading.value = false
    }
  }
  return { loading, handlerRegister }
}

export const useForgetPassword = () => {
  const loading = ref(false)
  const handlerForgetPassword = async (req: RegisterAccountRequest) => {
    try {
      loading.value = true
      const resp = await forgetPassword({
        ...req,
        password: encryptPassword(req.password),
        confirmPassword: encryptPassword(req.confirmPassword),
      })
      Message.success(resp.message)
    } finally {
      loading.value = false
    }
  }
  return { loading, handlerForgetPassword }
}

export const useSendVerificationCode = () => {
  const loading = ref(false)
  const handlerSendCode = async (email: string) => {
    try {
      loading.value = true
      const resp = await sendVerificationCode(email)
      Message.success(resp.message)
    } finally {
      loading.value = false
    }
  }
  return { loading, handlerSendCode }
}
