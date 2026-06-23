import type { CommentItem, HistoryItem, OutlineNode, PointRecord, ResourceItem, TemplateItem } from './types'

export const MOCK_TEMPLATES: TemplateItem[] = [
  {
    id: '1',
    title: '基于深度学习的图像识别在医学诊断中的应用研究',
    author: '学术小白',
    likes: 128,
    createdAt: '2025-06-18',
    theme: 'blue',
    description: '涵盖 CNN、ResNet 等模型在 X 光、CT 影像分析中的实践。',
    comments: [
      { id: 'c1', author: '李研究', content: '结构很清晰，对我写综述很有帮助！', date: '06-19' },
      { id: 'c2', author: '王同学', content: '第三章的模型设计部分可以再细化一下', date: '06-20' },
    ],
  },
  {
    id: '2',
    title: '碳中和背景下企业 ESG 信息披露质量评价',
    author: '绿色研究',
    likes: 86,
    createdAt: '2025-06-17',
    theme: 'teal',
  },
  {
    id: '3',
    title: '大语言模型在教育领域的应用与挑战分析',
    author: 'AI 学者',
    likes: 256,
    createdAt: '2025-06-16',
    theme: 'indigo',
  },
  {
    id: '4',
    title: '新媒体时代大学生心理健康干预策略研究',
    author: '心理驿站',
    likes: 64,
    createdAt: '2025-06-15',
    theme: 'amber',
  },
]

export const MOCK_RESOURCES: ResourceItem[] = [
  { id: 'r1', title: 'LaTeX 论文模板合集', desc: '涵盖 IEEE、ACM、中文学位论文等多种格式模板', tag: '免费', tagColor: 'blue', count: '1.2k 下载', category: 0 },
  { id: 'r2', title: '学术图表素材库', desc: '高质量流程图、架构图、数据可视化素材', tag: '开源', tagColor: 'teal', count: '856 下载', category: 0 },
  { id: 'r3', title: '参考文献格式规范手册', desc: 'GB/T 7714、APA、MLA 等引用格式完整指南', tag: '文档', tagColor: 'purple', count: '2.3k 阅读', category: 0 },
  { id: 'r4', title: '论文封面与扉页模板', desc: '各高校学位论文封面设计规范与模板下载', tag: '模板', tagColor: 'amber', count: '645 下载', category: 0 },
  { id: 'r5', title: 'Grammarly 写作助手', desc: '英文论文语法检查与润色工具', tag: '工具', tagColor: 'blue', count: '热门', category: 1 },
  { id: 'r6', title: 'Zotero 文献管理', desc: '开源文献管理与引用生成工具', tag: '推荐', tagColor: 'teal', count: '3.5k 使用', category: 1 },
  { id: 'r7', title: '论文开题报告撰写指南', desc: '从选题到框架设计的完整教程', tag: '教程', tagColor: 'blue', count: '1.8k 阅读', category: 2 },
  { id: 'r8', title: 'SCI 论文投稿流程', desc: '期刊选择、投稿系统与修回应对策略', tag: '教程', tagColor: 'purple', count: '920 阅读', category: 2 },
]

export const MOCK_HISTORY: HistoryItem[] = [
  { id: 'h1', title: '基于机器学习的智慧城市建设中交通流量预测模型研究', createdAt: '2025-06-22 14:30', sectionCount: 8, status: 'generated' },
  { id: 'h2', title: '碳中和背景下企业 ESG 信息披露质量评价', createdAt: '2025-06-20 09:15', sectionCount: 6, status: 'generated' },
  { id: 'h3', title: '大语言模型在教育领域的应用与挑战分析', createdAt: '2025-06-18 16:42', sectionCount: 7, status: 'shared' },
  { id: 'h4', title: '新媒体时代大学生心理健康干预策略研究', createdAt: '2025-06-15 11:20', sectionCount: 5, status: 'generated' },
]

export const MOCK_EARN_RECORDS: PointRecord[] = [
  { id: 'p1', title: '每日签到', time: '2025-06-23 08:30', amount: 10, type: 'earn' },
  { id: 'p2', title: '每日签到', time: '2025-06-22 09:12', amount: 10, type: 'earn' },
  { id: 'p3', title: '新用户注册奖励', time: '2025-06-18 10:00', amount: 50, type: 'earn' },
  { id: 'p4', title: '每日签到', time: '2025-06-21 08:45', amount: 10, type: 'earn' },
]

export function generateOutline(_prompt: string): OutlineNode[] {
  return [
    { id: 'o1', title: '1. 引言', level: 1, checked: true },
    { id: 'o2', title: '1.1 研究背景', level: 2, checked: true },
    { id: 'o3', title: '1.2 研究意义', level: 2, checked: true },
    { id: 'o4', title: '1.3 研究内容与方法', level: 2, checked: true },
    { id: 'o5', title: '2. 文献综述', level: 1, checked: true },
    { id: 'o6', title: '2.1 智慧交通研究现状', level: 2, checked: true },
    { id: 'o7', title: '2.2 机器学习预测模型', level: 2, checked: true },
    { id: 'o8', title: '3. 研究方法', level: 1, checked: true },
    { id: 'o9', title: '3.1 数据采集与预处理', level: 2, checked: true },
    { id: 'o10', title: '3.2 模型构建与训练', level: 2, checked: true },
    { id: 'o11', title: '4. 实验与分析', level: 1, checked: true },
    { id: 'o12', title: '5. 结论与展望', level: 1, checked: true },
  ]
}

export function flattenOutline(nodes: OutlineNode[]): OutlineNode[] {
  return nodes
}

export function getTemplateById(id: string): TemplateItem | undefined {
  const t = MOCK_TEMPLATES.find(item => item.id === id)
  if (!t) return undefined
  return {
    ...t,
    outline: t.outline || [
      { id: 'd1', title: '1. 引言', level: 1, checked: true },
      { id: 'd2', title: '1.1 研究背景与意义', level: 2, checked: true },
      { id: 'd3', title: '2. 相关理论与技术', level: 1, checked: true },
      { id: 'd4', title: '3. 模型设计与实现', level: 1, checked: true },
      { id: 'd5', title: '4. 实验结果与分析', level: 1, checked: true },
      { id: 'd6', title: '5. 结论与展望', level: 1, checked: true },
    ],
    comments: t.comments || [],
  }
}

export function searchTemplates(keyword: string): TemplateItem[] {
  const k = keyword.trim().toLowerCase()
  if (!k) return MOCK_TEMPLATES
  return MOCK_TEMPLATES.filter(
    t => t.title.toLowerCase().includes(k) || t.author.toLowerCase().includes(k),
  )
}

export function highlightKeyword(text: string, keyword: string): string {
  return text
}
