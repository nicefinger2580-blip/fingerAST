import { cloudLogin, isLoggedIn } from '../../utils/auth'
import { isMiniAppHost, pickAvatarFromAlbum } from '../../utils/platform'

Page({
  data: {
    previewNickName: '',
    previewAvatar: '',
    loggingIn: false,
    canLogin: false,
    isMiniApp: false,
  },

  onLoad() {
    this.setData({ isMiniApp: isMiniAppHost() })
    if (isLoggedIn()) {
      wx.navigateBack({
        fail: () => wx.switchTab({ url: '/pages/mine/mine' }),
      })
    }
  },

  onChooseAvatar(e: WechatMiniprogram.CustomEvent) {
    const avatarUrl = e.detail.avatarUrl as string
    if (!avatarUrl) return
    this.setData({ previewAvatar: avatarUrl })
    this.syncCanLogin()
  },

  async onPickAvatar() {
    if (this.data.loggingIn) return
    try {
      const avatarUrl = await pickAvatarFromAlbum()
      this.setData({ previewAvatar: avatarUrl })
      this.syncCanLogin()
    } catch (err) {
      wx.showToast({
        title: err instanceof Error ? err.message : '选择头像失败',
        icon: 'none',
      })
    }
  },

  onNicknameInput(e: WechatMiniprogram.Input) {
    this.setData({ previewNickName: (e.detail.value || '').trim() })
    this.syncCanLogin()
  },

  onNicknameBlur(e: WechatMiniprogram.Input) {
    this.setData({ previewNickName: (e.detail.value || '').trim() })
    this.syncCanLogin()
  },

  syncCanLogin() {
    const { previewNickName, previewAvatar } = this.data
    this.setData({
      canLogin: !!(previewNickName && previewAvatar),
    })
  },

  onWechatAuth() {
    if (this.data.loggingIn) return
    const { previewNickName, previewAvatar, canLogin } = this.data
    if (!canLogin) {
      wx.showToast({
        title: '请先点击头像并填写昵称',
        icon: 'none',
        duration: 2500,
      })
      return
    }
    this.doLogin(previewNickName, previewAvatar)
  },

  async doLogin(nickName: string, avatarUrl: string) {
    if (this.data.loggingIn) return
    this.setData({ loggingIn: true })
    wx.showLoading({ title: '登录中...' })
    try {
      const user = await cloudLogin(nickName, avatarUrl)
      getApp<IAppOption>().globalData.user = user
      this.setData({
        previewNickName: user.nickName,
        previewAvatar: user.avatarUrl,
      })
      wx.hideLoading()
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack({
          fail: () => wx.switchTab({ url: '/pages/mine/mine' }),
        })
      }, 800)
    } catch (err) {
      wx.hideLoading()
      wx.showToast({
        title: err instanceof Error ? err.message : '登录失败',
        icon: 'none',
        duration: 2500,
      })
      this.setData({ loggingIn: false })
    }
  },

  onCancel() {
    wx.navigateBack({
      fail: () => wx.switchTab({ url: '/pages/mine/mine' }),
    })
  },
})
