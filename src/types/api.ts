// 基础响应数据格式
export interface ApiResponse<T> {
  code: string
  data: T
  message: string
}

// 分页信息
export interface Paginator {
  current_page: number
  page_size: number
  total_page: number
  total_record: number
}

// 分页响应数据格式
export interface PaginatedResponse<T = never> {
  data: T[]
  paginator: Paginator
}

// 常用的响应状态码
export enum ApiCode {
  SUCCESS = 'success',
  ERROR = 'error',
  UNAUTHORIZED = 'unauthorized',
}
