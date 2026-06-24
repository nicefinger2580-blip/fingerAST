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

/** 提示词可含【题目】【格式】等规范，AI 将严格遵循 */
export const PROMPT_PRESETS: Record<string, string> = {
  社会科学类: '【题目】新媒体时代大学生社交焦虑的成因分析与干预策略研究\n【格式】本科毕业论文；摘要300字+关键词3-5个；正文约6000字；参考文献15篇；章节：摘要/Abstract/引言/文献综述/研究方法/分析与讨论/结论/参考文献；引用格式 GB/T 7714',
  计算机类: '【题目】基于机器学习的智慧城市建设中交通流量预测模型研究\n【格式】硕士学位论文；含中英文摘要；正文约8000字；章节：绪论/相关理论与技术/模型设计/实验与分析/总结与展望/参考文献；图表需编号；引用 GB/T 7714',
  经济管理类: '【题目】碳中和背景下企业 ESG 信息披露质量评价研究\n【格式】期刊论文体例；摘要200字；关键词4个；正文约5000字；结构：引言/理论分析与研究假设/研究设计/实证结果/结论与启示/参考文献',
  医学健康类: '【题目】基于深度学习的医学影像诊断辅助系统的应用研究\n【格式】综述论文；摘要250字；正文约7000字；章节：前言/影像AI技术进展/典型应用场景/挑战与展望/结论/参考文献；循证表述，引用 GB/T 7714',
}

export const PROMPT_HINT = '可在提示词中指定【题目】【格式规范】【字数】【章节结构】【引用格式】等，AI 将严格按你的要求生成全文'

export const MAX_PROMPT_LEN = 1500
