import { type PasswordLoginResponse } from '@/models/auth'
import { type BaseResponse } from '@/models/base'
import request from '@/utils/request'

export const passwordLogin = (email: string, password: string) => {
  return request.post<PasswordLoginResponse>(`/auth/password-login`, {
    body: {
      email,
      password,
    },
  })
}

export const logout = () => {
  return request.post<BaseResponse<unknown>>(`/auth/logout`)
}
