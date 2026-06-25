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
  authorOpenid?: string
  authorAvatarUrl?: string
  likes: number
  createdAt: string
  theme: string
  description?: string
  sectionCount?: number
  outline?: OutlineNode[]
  comments?: CommentItem[]
  coverPattern?: number
  coverSize?: 'sm' | 'md' | 'lg'
  avatarError?: boolean
}

export interface CommentItem {
  id: string
  author: string
  authorAvatarUrl?: string
  avatarError?: boolean
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
  subType?: string
  subTypeLabel?: string
  icon?: string
  url?: string
  content?: string
  hasContent?: boolean
  sort?: number
}

export interface ResourceGroup {
  subType: string
  label: string
  items: ResourceItem[]
}

export interface FavoriteItem {
  id: string
  paperId: string
  title: string
  author: string
  desc?: string
  theme?: string
  favoritedAt: string
}

export interface FollowUserItem {
  openid: string
  nickName: string
  avatarUrl: string
  followedAt: string
  avatarError?: boolean
}

export interface UserPublicProfile {
  openid: string
  nickName: string
  avatarUrl: string
  followerCount: number
  followingCount: number
  isSelf: boolean
  following: boolean
}

export interface PointRecord {
  id: string
  title: string
  time: string
  amount: number
  type: 'earn' | 'spend'
}
