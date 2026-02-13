import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

interface UserInfo {
  id: string
  username: string
  email: string
  avatar?: string
}

export const useAccountStore = defineStore('account', () => {
  const userInfo = ref<UserInfo | null>(null)
  const token = ref<string>('')

  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.username || '')

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  function setToken(newToken: string) {
    token.value = newToken
  }

  function login(info: UserInfo, authToken: string) {
    setUserInfo(info)
    setToken(authToken)
  }

  function logout() {
    userInfo.value = null
    token.value = ''
  }

  return {
    userInfo,
    token,
    isLoggedIn,
    username,
    setUserInfo,
    setToken,
    login,
    logout,
  }
})
