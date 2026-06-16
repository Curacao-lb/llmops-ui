import type { BaseResponse } from '@/models/base'

// TODO: 临时假实现，待后端接口就绪后替换为真实的 request 调用

export type UploadImageResponse = BaseResponse<{ image_url: string }>

export type UploadFileResponse = BaseResponse<Record<string, unknown>>

// 模拟接口延迟
const mockDelay = (ms: number = 800) => new Promise((resolve) => setTimeout(resolve, ms))

// 上传图片（假数据）
export const uploadImage = async (image: File): Promise<UploadImageResponse> => {
  await mockDelay()
  return {
    code: 'success',
    message: '',
    data: {
      // 使用本地预览地址作为假的图片链接
      image_url: URL.createObjectURL(image),
    },
  }
}

// 上传文件（假数据）
export const uploadFile = async (file: File): Promise<UploadFileResponse> => {
  await mockDelay()
  return {
    code: 'success',
    message: '',
    data: {
      id: `mock-${Date.now()}`,
      name: file.name,
      size: file.size,
      mime_type: file.type,
      key: `mock/${file.name}`,
      url: URL.createObjectURL(file),
      created_at: Math.floor(Date.now() / 1000),
    },
  }
}
