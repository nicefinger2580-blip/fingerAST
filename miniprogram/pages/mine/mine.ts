import { getUser, logout, requireLogin, clearCache, cloudLogin, fetchProfile } from '../../utils/auth'
import type { UserProfile } from '../../utils/types'

Page({
  data: {
    loggedIn: false,
    user: null as UserProfile | null,
    historyCount: 0,
    favoritePreview: '深度学习在医学影像中的应用',
    loggingIn: false,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    this.refreshUser()
  },

  async refreshUser() {
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
    getApp<IAppOption>().globalData.user = null
    this.setData({
      loggedIn: false,
      user: null,
      historyCount: 0,
    })
  },

  async onLoginTap() {
    if (this.data.loggingIn) return
    if (getUser()?.openid) return

    this.setData({ loggingIn: true })
    wx.showLoading({ title: '登录中...' })

    const doLogin = async (nickName: string, avatarUrl: string) => {
      try {
        const user = await cloudLogin(nickName, avatarUrl)
        getApp<IAppOption>().globalData.user = user
        this.setData({ loggedIn: true, user, historyCount: user.historyCount ?? 0 })
        wx.showToast({ title: '登录成功', icon: 'success' })
      } catch (err) {
        wx.showToast({
          title: err instanceof Error ? err.message : '登录失败',
          icon: 'none',
        })
      } finally {
        wx.hideLoading()
        this.setData({ loggingIn: false })
      }
    }

    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => doLogin(res.userInfo.nickName, res.userInfo.avatarUrl),
      fail: () => doLogin('微信用户', ''),
    })
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
        if (res.confirm) {
          logout()
          this.refreshUser()
          wx.showToast({ title: '已退出', icon: 'none' })
        }
      },
    })
  },
})
