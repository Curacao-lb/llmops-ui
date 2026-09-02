import type { BaseResponse } from '@/models/base'

// 概览指标数据结构（数据值 + 环比增长率）
export type OverviewIndicator = {
  data: number
  pop: number
}

// 趋势数据结构（x轴为时间戳、y轴为对应指标数值）
export type TrendData = {
  x_axis: number[]
  y_axis: number[]
}

// 获取应用统计分析结果响应结构
export type GetAppAnalysisResponse = BaseResponse<{
  // 概览指标
  total_messages: OverviewIndicator
  active_accounts: OverviewIndicator
  avg_of_conversation_messages: OverviewIndicator
  token_output_rate: OverviewIndicator
  cost_consumption: OverviewIndicator
  // 趋势数据
  total_messages_trend: TrendData
  active_accounts_trend: TrendData
  avg_of_conversation_messages_trend: TrendData
  cost_consumption_trend: TrendData
}>
