export interface UserProfile {
  _id?: string
  openid?: string
  nickName: string
  avatarUrl: string
  points: number
  signedDays: number
  signedDates: string[]
  historyCount: number
}

export interface TemplateItem {
  id: string
  title: string
  author: string
  likes: number
  createdAt: string
  theme: string
  description?: string
  sectionCount?: number
  outline?: OutlineNode[]
  comments?: CommentItem[]
}

export interface CommentItem {
  id: string
  author: string
  content: string
  date: string
}

export interface OutlineNode {
  id: string
  title: string
  level: number
  content?: string
  checked: boolean
  children?: OutlineNode[]
}

export interface HistoryItem {
  id: string
  title: string
  createdAt: string
  sectionCount: number
  status: 'generated' | 'shared'
}

export interface ResourceItem {
  id: string
  title: string
  desc: string
  tag: string
  tagColor: string
  count: string
  category: number
}

export interface PointRecord {
  id: string
  title: string
  time: string
  amount: number
  type: 'earn' | 'spend'
}
