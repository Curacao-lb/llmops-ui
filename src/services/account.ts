import type { GetCurrentUserResponse, RegisterAccountRequest } from '@/models/account'
import { type BaseResponse } from '@/models/base'
import request from '@/utils/request'

// 获取当前登录账号信息
export const getCurrentUser = () => {
  return request.get<GetCurrentUserResponse>(`/account`)
}

// 更新账号的密码
export const updatePassword = (password: string) => {
  return request.post<BaseResponse<unknown>>(`/account/password`, {
    password,
  })
}

// 更新账号的名字
export const updateName = (name: string) => {
  return request.post<BaseResponse<unknown>>(`/account/name`, {
    body: { name },
  })
}

// 更新账号的头像
export const updateAvatar = (avatar: string) => {
  return request.post<BaseResponse<unknown>>(`/account/avatar`, {
    body: { avatar },
  })
}

export const register = (req: RegisterAccountRequest) => {
  return request.post<BaseResponse<unknown>>(`/account/register`, { body: req })
}

export const sendVerificationCode = (email: string) => {
  return request.post<BaseResponse<unknown>>(`/account/sendVerificationCode`, { body: { email } })
}

export const forgetPassword = (req: RegisterAccountRequest) => {
  return request.post<BaseResponse<unknown>>(`/account/forgetPassword`, { body: req })
}
