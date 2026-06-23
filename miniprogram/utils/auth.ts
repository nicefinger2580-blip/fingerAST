import { COST } from './constants'
import type { UserProfile } from './types'

const USER_KEY = 'finger_user'
const SEARCH_HISTORY_KEY = 'finger_search_history'
const HOME_CACHE_KEY = 'finger_home_cache'

export function getUser(): UserProfile | null {
  try {
    return wx.getStorageSync(USER_KEY) || null
  } catch {
    return null
  }
}

export function isLoggedIn(): boolean {
  return !!getUser()
}

export function saveUser(user: UserProfile): void {
  wx.setStorageSync(USER_KEY, user)
}

export function login(userInfo: WechatMiniprogram.UserInfo): UserProfile {
  const existing = getUser()
  const user: UserProfile = {
    nickName: userInfo.nickName || '微信用户',
    avatarUrl: userInfo.avatarUrl || '',
    points: existing?.points ?? COST.registerReward,
    signedDays: existing?.signedDays ?? 0,
    signedDates: existing?.signedDates ?? [],
    historyCount: existing?.historyCount ?? 0,
  }
  saveUser(user)
  return user
}

export function logout(): void {
  wx.removeStorageSync(USER_KEY)
}

export function updatePoints(delta: number): UserProfile | null {
  const user = getUser()
  if (!user) return null
  user.points = Math.max(0, user.points + delta)
  saveUser(user)
  return user
}

export function requireLogin(): boolean {
  if (isLoggedIn()) return true
  wx.showModal({
    title: '提示',
    content: '请先登录以使用该功能',
    confirmText: '去登录',
    confirmColor: '#3B7CFF',
    success(res) {
      if (res.confirm) {
        wx.switchTab({ url: '/pages/mine/mine' })
      }
    },
  })
  return false
}

export function getSearchHistory(): string[] {
  try {
    return wx.getStorageSync(SEARCH_HISTORY_KEY) || []
  } catch {
    return []
  }
}

export function addSearchHistory(keyword: string): string[] {
  const k = keyword.trim()
  if (!k) return getSearchHistory()
  const list = [k, ...getSearchHistory().filter(h => h !== k)].slice(0, 10)
  wx.setStorageSync(SEARCH_HISTORY_KEY, list)
  return list
}

export function clearSearchHistory(): void {
  wx.removeStorageSync(SEARCH_HISTORY_KEY)
}

export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function hasSignedToday(user: UserProfile): boolean {
  return user.signedDates.includes(todayStr())
}

export function clearCache(): void {
  wx.removeStorageSync(HOME_CACHE_KEY)
  wx.showToast({ title: '缓存已清除', icon: 'success' })
}
