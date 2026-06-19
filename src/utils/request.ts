/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { useAccountStore } from '@/stores/account'
import type { ApiResponse } from '@/types/api'
import { apiPrefix } from '@/config'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 20000,
})

type FetchOptionType = Omit<RequestInit, 'body'> & {
  params?: Record<string, any>
  body?: BodyInit | Record<string, any> | null
}

// 静态的 fetch 默认配置（不含 headers / body，二者按请求单独构建，避免实例被复用）
const baseFetchOptions: Omit<RequestInit, 'headers' | 'body'> = {
  method: 'GET',
  mode: 'cors',
  credentials: 'include',
  redirect: 'follow',
}


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
    const data = response.data as ApiResponse<unknown>

    // 如果 code 不是 success，抛出错误
    if (data.code !== 'success') {
      return Promise.reject(new Error(data.message || '请求失败'))
    }

    // 返回完整响应体（包含 code/message/data），与各 service 泛型及 hook 中
    // resp.data / resp.message 的用法保持一致
    return data as unknown as AxiosResponse
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

const handleStream = (
  response: Response,
  onData: (data: Record<string, any>) => void,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 检测网络请求是否正常
    if (!response.ok) {
      reject(new Error('网络请求失败'))
      return
    }
    // 构建reader以及decoder
    const reader = response.body?.getReader()
    if (!reader) {
      resolve()
      return
    }
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let event = ''
    let data = ''

    // 构建read函数用于去读取数据
    const read = () => {
      reader
        .read()
        .then((result) => {
          if (result.done) {
            resolve()
            return
          }
          buffer += decoder.decode(result.value, { stream: true })
          const lines = buffer.split('\n')
          // 最后一行可能是不完整的数据，先保留到下一次读取再处理
          buffer = lines.pop() ?? ''

          try {
            for (const rawLine of lines) {
              const line = rawLine.trim()
              if (line.startsWith('event:')) {
                event = line.slice(6).trim()
              } else if (line.startsWith('data:')) {
                data = line.slice(5).trim()
              } else if (line === '') {
                // 每个事件以空行结束，只有event和data同时存在，才表示一次流式事件的数据完整获取到了
                if (event !== '' && data !== '') {
                  onData({
                    event: event,
                    data: JSON.parse(data),
                  })
                  event = ''
                  data = ''
                }
              }
            }
          } catch (e) {
            reject(e)
            return
          }

          read()
        })
        .catch(reject)
    }

    // 调用read函数去执行获取对应的数据
    read()
  })
}

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
  ssePost: async (
    url: string,
    fetchOptions: FetchOptionType,
    onData: (data: { [key: string]: any }) => void,
  ) => {
    // 解构出需要单独处理的字段，其余配置原样透传
    const { body, headers: customHeaders, ...restOptions } = fetchOptions

    // 每次请求都新建 Headers，避免复用同一实例导致请求之间 token 串号
    const headers = new Headers({ 'Content-Type': 'application/json' })
    if (customHeaders) {
      new Headers(customHeaders).forEach((value, key) => headers.set(key, value))
    }

    // 鉴权信息与 axios 拦截器保持一致，统一从 account store 读取 token
    const accountStore = useAccountStore()
    if (accountStore.token) {
      headers.set('Authorization', `Bearer ${accountStore.token}`)
    }

    // 组装基础的fetch请求配置
    const options: RequestInit = {
      ...baseFetchOptions,
      ...restOptions,
      method: 'POST',
      headers,
    }

    // 处理body对应的数据
    if (body) options.body = JSON.stringify(body)

    // 组装请求URL
    const urlWithPrefix = `${apiPrefix}${url.startsWith('/') ? url : `/${url}`}`

    // 发起fetch请求并处理流式事件响应
    const response = await globalThis.fetch(urlWithPrefix, options)

    // 获取响应内容类型并判断类型
    const contentType = response.headers.get('Content-Type')
    if (contentType?.includes('application/json')) {
      // 接口为json输出，意味着出错，直接返回json数据
      return await response.json()
    }

    // 否则获取流式输出数据
    return await handleStream(response, onData)
  },
}

export default request
