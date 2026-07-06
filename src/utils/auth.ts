import storage from './storage'

interface Credential {
  access_token: string
  expire_at: number
}

export default {
  isLogin: (): boolean => {
    // 1，从localstorage中查找授权凭证信息
    const credential = storage.get<Credential | null>('credential', null)
    const now = Math.floor(Date.now() / 1000)
    // 2.判断凭证上是否存在access_token，并判断是否过期
    if (
      !credential ||
      !credential.access_token ||
      !credential.expire_at ||
      credential.expire_at < now
    ) {
      storage.clear()
      return false
    }
    // 满足所有条件，返回true
    return true
  },
}
