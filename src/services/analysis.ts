import request from '@/utils/request'
import type { GetAppAnalysisResponse } from '@/models/analysis'

// 获取指定应用的统计分析信息
export const getAppAnalysis = (app_id: string) => {
  return request.get<GetAppAnalysisResponse>(`/analysis/${app_id}`)
}
