import storage from '@/utils/storage'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Credential = {
  access_token: string
  expire_at: number
}

const initCredential: Credential = {
  access_token: '',
  expire_at: 0,
}

export const useCredentialStore = defineStore('credential', () => {
  const credential = ref<Credential>(storage.get('credential', initCredential) as Credential)
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
