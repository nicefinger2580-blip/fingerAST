import { getUser, updateUserProfile, requireLogin } from '../../utils/auth'
import type { UserProfile } from '../../utils/types'

Page({
  data: {
    user: null as UserProfile | null,
    pendingNickName: '',
    saving: false,
  },

  onLoad() {
    if (!requireLogin()) {
      setTimeout(() => wx.navigateBack(), 300)
      return
    }
    const user = getUser()
    if (user) {
      this.setData({ user, pendingNickName: user.nickName })
    }
  },

  onShow() {
    const user = getUser()
    if (user) {
      this.setData({ user, pendingNickName: user.nickName })
    }
  },

  async onChooseAvatar(e: WechatMiniprogram.CustomEvent) {
    if (this.data.saving) return
    const avatarUrl = e.detail.avatarUrl as string
    if (!avatarUrl) return
    this.setData({ saving: true })
    wx.showLoading({ title: '保存中...' })
    try {
      const user = await updateUserProfile({ avatarUrl })
      getApp<IAppOption>().globalData.user = user
      this.setData({ user })
      wx.showToast({ title: '头像已更新', icon: 'success' })
    } catch (err) {
      wx.showToast({
        title: err instanceof Error ? err.message : '更新失败',
        icon: 'none',
      })
    } finally {
      wx.hideLoading()
      this.setData({ saving: false })
    }
  },

  onNicknameInput(e: WechatMiniprogram.Input) {
    this.setData({ pendingNickName: (e.detail.value || '').trim() })
  },

  async onNicknameBlur(e: WechatMiniprogram.Input) {
    const nickName = (e.detail.value || '').trim()
    const current = this.data.user?.nickName || ''
    if (!nickName || nickName === current || this.data.saving) return
    this.setData({ saving: true })
    wx.showLoading({ title: '保存中...' })
    try {
      const user = await updateUserProfile({ nickName })
      getApp<IAppOption>().globalData.user = user
      this.setData({ user, pendingNickName: user.nickName })
      wx.showToast({ title: '昵称已更新', icon: 'success' })
    } catch (err) {
      wx.showToast({
        title: err instanceof Error ? err.message : '更新失败',
        icon: 'none',
      })
    } finally {
      wx.hideLoading()
      this.setData({ saving: false })
    }
  },
})
