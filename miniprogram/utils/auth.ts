import { COST } from './constants'
import type { UserProfile } from './types'
import { callCloud } from './cloud'

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
  return !!getUser()?.openid
}

export function saveUser(user: UserProfile): void {
  wx.setStorageSync(USER_KEY, user)
}

export function logout(): void {
  wx.removeStorageSync(USER_KEY)
}

export async function cloudLogin(nickName: string, avatarUrl: string): Promise<UserProfile> {
  const data = await callCloud<{ user: UserProfile; isNew?: boolean }>('login', {
    action: 'login',
    nickName,
    avatarUrl,
  })
  saveUser(data.user)
  return data.user
}

export async function fetchProfile(): Promise<UserProfile | null> {
  try {
    const data = await callCloud<{ user: UserProfile }>('login', { action: 'getProfile' })
    saveUser(data.user)
    return data.user
  } catch {
    return null
  }
}

export async function cloudSignin(): Promise<{ user: UserProfile; reward: number }> {
  const data = await callCloud<{ user: UserProfile; reward: number }>('login', {
    action: 'signin',
  })
  saveUser(data.user)
  return data
}

/** @deprecated 积分变更请走云函数，此方法仅作本地缓存同步 */
export function syncUserPoints(user: UserProfile): void {
  saveUser(user)
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

export { COST }
