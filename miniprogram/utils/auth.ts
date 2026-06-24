import { COST } from './constants'
import type { UserProfile } from './types'
import { callCloud } from './cloud'

const USER_KEY = 'finger_user'
const LOGGED_OUT_KEY = 'finger_logged_out'
const SEARCH_HISTORY_KEY = 'finger_search_history'
const HOME_CACHE_KEY = 'finger_home_cache'

export function getUser(): UserProfile | null {
  try {
    return wx.getStorageSync(USER_KEY) || null
  } catch {
    return null
  }
}

export function isLoggedOut(): boolean {
  try {
    return !!wx.getStorageSync(LOGGED_OUT_KEY)
  } catch {
    return false
  }
}

export function isLoggedIn(): boolean {
  return !isLoggedOut() && !!getUser()?.openid
}

export function saveUser(user: UserProfile): void {
  wx.setStorageSync(USER_KEY, user)
  wx.removeStorageSync(LOGGED_OUT_KEY)
}

export function logout(): void {
  wx.setStorageSync(LOGGED_OUT_KEY, true)
  wx.removeStorageSync(USER_KEY)
}

export function goLoginPage(): void {
  wx.navigateTo({ url: '/pages/login/login' })
}

export function ensureWxSession(): Promise<void> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve()
          return
        }
        reject(new Error('微信登录失败'))
      },
      fail: (err) => reject(new Error(err.errMsg || '微信登录失败')),
    })
  })
}

/** 将本地或远程头像上传云存储，返回 fileID */
export async function uploadAvatarToCloud(tempPath: string): Promise<string> {
  if (!tempPath) return ''
  if (tempPath.startsWith('cloud://')) return tempPath

  let localPath = tempPath
  if (tempPath.startsWith('http://') || tempPath.startsWith('https://')) {
    const dl = await wx.downloadFile({ url: tempPath })
    if (dl.statusCode !== 200 || !dl.tempFilePath) {
      throw new Error('头像下载失败')
    }
    localPath = dl.tempFilePath
  }

  const extMatch = localPath.match(/\.(\w+)(?:\?|$)/)
  const ext = extMatch ? extMatch[1] : 'png'
  const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const res = await wx.cloud.uploadFile({ cloudPath, filePath: localPath })
  return res.fileID
}

/** 微信授权登录：需传入微信昵称与头像 */
export async function cloudLogin(nickName: string, avatarUrl: string): Promise<UserProfile> {
  if (!nickName?.trim()) {
    throw new Error('请先授权微信昵称')
  }
  await ensureWxSession()
  let storedAvatar = avatarUrl
  if (avatarUrl && !avatarUrl.startsWith('cloud://')) {
    try {
      storedAvatar = await uploadAvatarToCloud(avatarUrl)
    } catch {
      storedAvatar = avatarUrl
    }
  }
  const data = await callCloud<{ user: UserProfile; isNew?: boolean }>('login', {
    action: 'login',
    nickName: nickName.trim(),
    avatarUrl: storedAvatar,
  })
  saveUser(data.user)
  return data.user
}

/** 已登录用户恢复会话（用户未主动退出时） */
export async function silentLogin(): Promise<UserProfile | null> {
  if (isLoggedOut()) return null
  try {
    await ensureWxSession()
    const data = await callCloud<{ user: UserProfile | null; registered: boolean }>('login', {
      action: 'checkSession',
    })
    if (!data.registered || !data.user) {
      return null
    }
    saveUser(data.user)
    return data.user
  } catch {
    return null
  }
}

export async function updateUserProfile(
  profile: { nickName?: string; avatarUrl?: string },
): Promise<UserProfile> {
  await ensureWxSession()
  let avatarUrl = profile.avatarUrl
  if (avatarUrl && !avatarUrl.startsWith('cloud://')) {
    avatarUrl = await uploadAvatarToCloud(avatarUrl)
  }
  const data = await callCloud<{ user: UserProfile }>('login', {
    action: 'updateProfile',
    nickName: profile.nickName || '',
    avatarUrl: avatarUrl || '',
  })
  saveUser(data.user)
  return data.user
}

export async function fetchProfile(): Promise<UserProfile | null> {
  if (isLoggedOut()) return null
  try {
    await ensureWxSession()
    const data = await callCloud<{ user: UserProfile }>('login', { action: 'getProfile' })
    saveUser(data.user)
    return data.user
  } catch {
    return null
  }
}

export async function cloudSignin(): Promise<{ user: UserProfile; reward: number }> {
  await ensureWxSession()
  const data = await callCloud<{ user: UserProfile; reward: number }>('login', {
    action: 'signin',
    clientDate: todayStr(),
  })
  saveUser(data.user)
  return data
}

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
      if (res.confirm) goLoginPage()
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
