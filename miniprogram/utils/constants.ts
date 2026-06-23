export const COLORS = {
  primary: '#3B7CFF',
  secondary: '#5BC0BE',
  surface: '#F5F7FA',
  ink: '#1A2332',
  muted: '#6B7A8F',
  faint: '#B0BEC5',
  success: '#52C41A',
  warning: '#FAAD14',
  danger: '#FF4D4F',
}

export const COST = {
  generate: 5,
  exportDocx: 30,
  signinReward: 10,
  registerReward: 50,
}

export const FILTER_TABS = ['最新', '最热', '关注'] as const

export const RESOURCE_TABS = ['开源素材', '实用工具', '编写教程'] as const

export const PROMPT_PRESETS: Record<string, string> = {
  社会科学类: '新媒体时代大学生社交焦虑的成因分析与干预策略研究',
  计算机类: '基于机器学习的智慧城市建设中交通流量预测模型研究',
  经济管理类: '碳中和背景下企业 ESG 信息披露质量评价研究',
  医学健康类: '基于深度学习的医学影像诊断辅助系统的应用研究',
}
