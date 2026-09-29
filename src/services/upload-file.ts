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

const rasterizeSvg = async (svgFile: File): Promise<File> => {
  const objectUrl = URL.createObjectURL(svgFile)

  try {
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('无法读取 SVG 图片'))
      image.src = objectUrl
    })

    const maxDimension = 2048
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('无法处理 SVG 图片')
    context.drawImage(image, 0, 0, width, height)

    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('SVG 转换 PNG 失败'))
      }, 'image/png')
    })
    const filename = svgFile.name.replace(/\.svg$/i, '') || 'image'
    return new File([png], `${filename}.png`, { type: 'image/png' })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

// 上传图片，后端返回可访问的图片 URL
export const uploadImage = async (image: File): Promise<UploadImageResponse> => {
  const upload = image.type === 'image/svg+xml' || image.name.toLowerCase().endsWith('.svg')
    ? await rasterizeSvg(image)
    : image
  const formData = new FormData()
  formData.append('file', upload)
  return request.post<UploadImageResponse>('/upload-files/image', formData)
}

// 上传文件，后端返回文件记录信息
export const uploadFile = (file: File): Promise<UploadFileResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<UploadFileResponse>('/upload-files/file', formData)
}
