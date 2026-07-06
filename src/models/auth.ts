import type { BaseResponse } from './base'

export type LoginResponse = BaseResponse<{
  access_token: string
  expire_at: number
}>
