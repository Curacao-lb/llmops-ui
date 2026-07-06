import { ref } from 'vue'
import { passwordLogin } from '@/services/auth'
import { encryptPassword } from '@/utils/password'
import type { LoginResponse } from '@/models/auth'

type Authorization = LoginResponse['data']

export const usePasswordLogin = () => {
  const loading = ref(false)
  const authorization = ref<Authorization>({
    access_token: '',
    expire_at: 0,
  })

  const handlePasswordLogin = async (email: string, password: string) => {
    try {
      loading.value = true
      const resp = await passwordLogin(email, encryptPassword(password))
      authorization.value = resp.data
    } finally {
      loading.value = false
    }
  }

  return { loading, authorization, handlePasswordLogin }
}
