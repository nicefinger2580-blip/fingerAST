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
import type { UserProfile } from '../../utils/types'

Page({
  data: {
    loggedIn: false,
    user: null as UserProfile | null,
    historyCount: 0,
    favoritePreview: '深度学习在医学影像中的应用',
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    this.refreshUser()
  },

  async refreshUser() {
    if (isLoggedOut()) {
      getApp<IAppOption>().globalData.user = null
      this.setData({ loggedIn: false, user: null, historyCount: 0 })
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
      return
    }

    getApp<IAppOption>().globalData.user = null
    this.setData({
      loggedIn: false,
      user: null,
      historyCount: 0,
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
        })
        wx.showToast({ title: '已退出登录', icon: 'success' })
      },
    })
  },
})
