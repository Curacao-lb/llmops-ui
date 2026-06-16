import request from '@/utils/request'
import type { BaseResponse } from '@/models/base'

export type UploadImageResponse = BaseResponse<{ image_url: string }>

export type UploadFileResponse = BaseResponse<{
  id: string
  account_id: string
  name: string
  key: string
  size: number
  extension: string
  mime_type: string
  hash: string
  created_at: number
}>

// 上传图片，后端返回可访问的图片 URL
export const uploadImage = (image: File): Promise<UploadImageResponse> => {
  const formData = new FormData()
  formData.append('file', image)
  return request.post<UploadImageResponse>('/upload-files/image', formData)
}

// 上传文件，后端返回文件记录信息
export const uploadFile = (file: File): Promise<UploadFileResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<UploadFileResponse>('/upload-files/file', formData)
}
