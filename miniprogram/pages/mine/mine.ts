import { getUser, isLoggedIn, login, logout, requireLogin, clearCache } from '../../utils/auth'
import { MOCK_HISTORY } from '../../utils/mock'
import type { UserProfile } from '../../utils/types'

Page({
  data: {
    loggedIn: false,
    user: null as UserProfile | null,
    historyCount: MOCK_HISTORY.length,
    favoritePreview: '深度学习在医学影像中的应用',
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    this.refreshUser()
  },

  refreshUser() {
    const user = getUser()
    const app = getApp<IAppOption>()
    app.globalData.user = user
    this.setData({
      loggedIn: !!user,
      user,
      historyCount: user?.historyCount ?? MOCK_HISTORY.length,
    })
  },

  onLoginTap() {
    if (isLoggedIn()) return
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        login(res.userInfo)
        this.refreshUser()
        wx.showToast({ title: '登录成功', icon: 'success' })
      },
      fail: () => {
        const mockUser = login({
          nickName: '张同学',
          avatarUrl: '',
        } as WechatMiniprogram.UserInfo)
        this.refreshUser()
        wx.showToast({ title: '登录成功', icon: 'success' })
        console.log(mockUser)
      },
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

  goHistory() {
    if (!requireLogin()) return
    wx.navigateTo({ url: '/pages/history/history' })
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
