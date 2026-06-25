import {
  getUser,
  logout,
  requireLogin,
  clearCache,
  fetchProfile,
  silentLogin,
  goLoginPage,
  isLoggedOut,
  isLoggedIn,
} from '../../utils/auth'
import { callCloud } from '../../utils/cloud'
import type { FavoriteItem, FollowUserItem, UserProfile } from '../../utils/types'

Page({
  data: {
    loggedIn: false,
    user: null as UserProfile | null,
    historyCount: 0,
    followingCount: 0,
    followingPreview: null as FollowUserItem | null,
    favoriteCount: 0,
    favoritePreview: null as FavoriteItem | null,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    this.refreshUser()
  },

  async loadFollowing() {
    if (!getUser()?.openid) {
      this.setData({ followingCount: 0, followingPreview: null })
      return
    }
    try {
      const data = await callCloud<{ list: FollowUserItem[]; total: number }>('login', {
        action: 'listFollowing',
      })
      this.setData({
        followingCount: data.total,
        followingPreview: data.list[0] || null,
      })
    } catch {
      this.setData({ followingCount: 0, followingPreview: null })
    }
  },

  async loadFavorites() {
    if (!getUser()?.openid) {
      this.setData({ favoriteCount: 0, favoritePreview: null })
      return
    }
    try {
      const data = await callCloud<{ list: FavoriteItem[]; total: number }>('exhibit', {
        action: 'listFavorites',
      })
      this.setData({
        favoriteCount: data.total,
        favoritePreview: data.list[0] || null,
      })
    } catch {
      this.setData({ favoriteCount: 0, favoritePreview: null })
    }
  },

  async refreshUser() {
    if (isLoggedOut()) {
      getApp<IAppOption>().globalData.user = null
      this.setData({ loggedIn: false, user: null, historyCount: 0, followingCount: 0, followingPreview: null, favoriteCount: 0, favoritePreview: null })
      return
    }

    const local = getUser()
    if (local?.openid) {
      const remote = await fetchProfile()
      const user = remote || local
      getApp<IAppOption>().globalData.user = user
      this.setData({
        loggedIn: true,
        user,
        historyCount: user.historyCount ?? 0,
      })
      this.loadFollowing()
      this.loadFavorites()
      return
    }

    const silent = await silentLogin()
    if (silent) {
      getApp<IAppOption>().globalData.user = silent
      this.setData({
        loggedIn: true,
        user: silent,
        historyCount: silent.historyCount ?? 0,
      })
      this.loadFollowing()
      this.loadFavorites()
      return
    }

    getApp<IAppOption>().globalData.user = null
    this.setData({
      loggedIn: false,
      user: null,
      historyCount: 0,
      followingCount: 0,
      followingPreview: null,
      favoriteCount: 0,
      favoritePreview: null,
    })
  },

  onGoLogin() {
    if (isLoggedIn()) return
    goLoginPage()
  },

  onGoProfile() {
    if (!requireLogin()) return
    wx.navigateTo({ url: '/pages/profile/profile' })
  },

  onGridTap(e: WechatMiniprogram.TouchEvent) {
    const type = e.currentTarget.dataset.type as string
    if (!requireLogin()) return
    const routes: Record<string, string> = {
      history: '/pages/history/history',
      points: '/pages/points/points',
      signin: '/pages/signin/signin',
    }
    if (routes[type]) wx.navigateTo({ url: routes[type] })
  },

  onGoFollowing() {
    if (!requireLogin()) return
    wx.navigateTo({ url: '/pages/following/following' })
  },

  onGoFavorites() {
    if (!requireLogin()) return
    wx.navigateTo({ url: '/pages/favorites/favorites' })
  },

  onPointsTap() {
    if (!requireLogin()) return
    wx.navigateTo({ url: '/pages/points/points' })
  },

  onClearCache() {
    clearCache()
  },

  onFeedback() {
    wx.showToast({ title: '感谢您的反馈', icon: 'none' })
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      confirmColor: '#3B7CFF',
      success: (res) => {
        if (!res.confirm) return
        logout()
        getApp<IAppOption>().globalData.user = null
        this.setData({
          loggedIn: false,
          user: null,
          historyCount: 0,
          followingCount: 0,
          followingPreview: null,
          favoriteCount: 0,
          favoritePreview: null,
        })
        wx.showToast({ title: '已退出登录', icon: 'success' })
      },
    })
  },
})
