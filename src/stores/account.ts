import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import storage from '@/utils/storage'

interface UserInfo {
  id: string
  username: string
  email: string
  avatar?: string
}

// localStorage 存储键
const TOKEN_KEY = 'account_token'
const USER_INFO_KEY = 'account_user_info'

// 临时联调用的默认 token：请替换成后端能接受的真实 token
const DEFAULT_TOKEN = 'mock-token-123'

export const useAccountStore = defineStore('account', () => {
  // 初始化时优先读取本地持久化的 token，没有则回退到默认 token
  const token = ref<string>((storage.get(TOKEN_KEY, DEFAULT_TOKEN) as string) || DEFAULT_TOKEN)
  const userInfo = ref<UserInfo | null>((storage.get(USER_INFO_KEY, null) as UserInfo | null))

  // 首次启动若本地还没有 token，则把默认 token 写入，保证请求一定带上 Authorization
  if (!storage.get(TOKEN_KEY, '')) {
    storage.set(TOKEN_KEY, token.value)
  }

  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.username || 'robin')

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
    storage.set(USER_INFO_KEY, info)
  }

  function setToken(newToken: string) {
    token.value = newToken
    storage.set(TOKEN_KEY, newToken)
  }

  function login(info: UserInfo, authToken: string) {
    setUserInfo(info)
    setToken(authToken)
  }

  function logout() {
    userInfo.value = null
    token.value = ''
    storage.remove(TOKEN_KEY)
    storage.remove(USER_INFO_KEY)
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
