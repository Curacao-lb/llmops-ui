import axios from 'axios'
import { useAccountStore } from '@/stores/account'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const accountStore = useAccountStore()
    if (accountStore.token) {
      config.headers.Authorization = `Bearer ${accountStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      const accountStore = useAccountStore()
      accountStore.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default request
