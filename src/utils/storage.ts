export default {
  // 获取localstorage中的值
  get: (key: string, defaultValue: unknown = ''): unknown => {
    const value = localStorage.getItem(key)
    if (value) {
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
    return defaultValue
  },
  // 设置localstorage中的值
  set: (key: string, value: unknown): void => {
    if (typeof value === 'string') {
      localStorage.setItem(key, value)
    } else {
      localStorage.setItem(key, JSON.stringify(value))
    }
  },
  // 移除localstorage中的值
  remove: (key: string): void => {
    localStorage.removeItem(key)
  },
  clear: (): void => {
    localStorage.clear()
  },
}
