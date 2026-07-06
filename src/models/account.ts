import type { BaseResponse } from './base'

// 获取当前登录账号的响应结构
export type GetCurrentUserResponse = BaseResponse<{
  id: string
  name: string
  email: string
  avatar: string
  last_login_ip: string
  last_login_at: number
  created_at: number
}>

export type RegisterAccountRequest = {
  email: string
  password: string
  confirmPassword: string
  verificationCode: string
}
