import storage from '@/utils/storage'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LoginResponse } from '@/models/auth'

type Credential = LoginResponse['data']

// 定义基础授权凭证信息
const initCredential: Credential = {
  access_token: '',
  expire_at: 0,
}

export const useCredentialStore = defineStore('credential', () => {
  const credential = ref(storage.get('credential', initCredential))
  const update = (params: Credential) => {
    credential.value = params
    storage.set('credential', params)
  }
  const clear = () => {
    credential.value = initCredential
    storage.remove('credential')
  }
  return { credential, update, clear }
})
