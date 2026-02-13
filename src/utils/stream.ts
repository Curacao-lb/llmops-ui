import { useAccountStore } from '@/stores/account'

interface StreamOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  headers?: Record<string, string>
  onMessage: (text: string) => void
  onError?: (error: Error) => void
  onComplete?: () => void
}

/**
 * 流式请求，用于 AI 对话等需要逐字显示的场景
 */
export async function streamRequest(url: string, options: StreamOptions) {
  const accountStore = useAccountStore()
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
  const fullURL = url.startsWith('http') ? url : `${baseURL}${url}`

  try {
    const response = await fetch(fullURL, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accountStore.token ? `Bearer ${accountStore.token}` : '',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('Response body is not readable')
    }

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        options.onComplete?.()
        break
      }

      const text = decoder.decode(value, { stream: true })
      options.onMessage(text)
    }
  } catch (error) {
    options.onError?.(error as Error)
  }
}

/**
 * SSE (Server-Sent Events) 流式请求
 * 适用于服务端返回 text/event-stream 格式的场景
 */
export async function sseRequest(url: string, options: StreamOptions) {
  const accountStore = useAccountStore()
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
  const fullURL = url.startsWith('http') ? url : `${baseURL}${url}`

  try {
    const response = await fetch(fullURL, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accountStore.token ? `Bearer ${accountStore.token}` : '',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('Response body is not readable')
    }

    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        options.onComplete?.()
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            options.onComplete?.()
            return
          }
          try {
            const json = JSON.parse(data)
            options.onMessage(json)
          } catch {
            options.onMessage(data)
          }
        }
      }
    }
  } catch (error) {
    options.onError?.(error as Error)
  }
}
