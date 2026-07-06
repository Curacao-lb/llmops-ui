import { type LoginResponse } from '@/models/auth'
import { type BaseResponse } from '@/models/base'
import request from '@/utils/request'

export const passwordLogin = (email: string, password: string) => {
  return request.post<LoginResponse>(`/auth/password-login`, {
    email,
    password,
  })
}

export const logout = () => {
  return request.post<BaseResponse<unknown>>(`/auth/logout`)
}
