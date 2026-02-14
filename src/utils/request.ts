/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { type AxiosRequestConfig } from 'axios'
import { useAccountStore } from '@/stores/account'
import type { ApiResponse } from '@/types/api'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    const accountStore = useAccountStore()
    if (accountStore.token) {
      config.headers.Authorization = `Bearer ${accountStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response) => {
    const data: ApiResponse<never> = response.data

    // 如果 code 不是 success，抛出错误
    if (data.code !== 'success') {
      return Promise.reject(new Error(data.message || '请求失败'))
    }

    // 返回 data 字段
    return data.data
  },
  (error) => {
    if (error.response?.status === 401) {
      const accountStore = useAccountStore()
      accountStore.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// 包装请求方法以提供正确的类型
const request = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.get(url, config)
  },
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.post(url, data, config)
  },
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.put(url, data, config)
  },
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.delete(url, config)
  },
}

export default request
