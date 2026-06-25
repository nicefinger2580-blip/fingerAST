import { getUser, requireLogin } from '../../utils/auth'
import { callCloud } from '../../utils/cloud'
import type { FollowUserItem } from '../../utils/types'

Page({
  data: {
    list: [] as FollowUserItem[],
    loading: true,
  },

  onShow() {
    this.loadList()
  },

  async loadList() {
    if (!getUser()?.openid) {
      if (!requireLogin()) {
        this.setData({ loading: false, list: [] })
        return
      }
    }
    this.setData({ loading: true })
    try {
      const data = await callCloud<{ list: FollowUserItem[] }>('login', {
        action: 'listFollowing',
      })
      this.setData({ list: data.list, loading: false })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({
        title: err instanceof Error ? err.message : '加载失败',
        icon: 'none',
      })
    }
  },

  onAvatarError(e: WechatMiniprogram.TouchEvent) {
    const openid = e.currentTarget.dataset.openid as string
    this.setData({
      list: this.data.list.map((item) =>
        item.openid === openid ? { ...item, avatarError: true } : item,
      ),
    })
  },

  onViewUser(e: WechatMiniprogram.TouchEvent) {
    const openid = e.currentTarget.dataset.openid as string
    wx.navigateTo({ url: `/pages/user/user?openid=${encodeURIComponent(openid)}` })
  },

  async onUnfollow(e: WechatMiniprogram.TouchEvent) {
    const openid = e.currentTarget.dataset.openid as string
    if (!openid || !requireLogin()) return
    wx.showModal({
      title: '取消关注',
      content: '确定取消关注该用户吗？',
      confirmColor: '#3B7CFF',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await callCloud('login', { action: 'toggleFollow', targetOpenid: openid })
          this.setData({ list: this.data.list.filter((item) => item.openid !== openid) })
          wx.showToast({ title: '已取消关注', icon: 'none' })
        } catch (err) {
          wx.showToast({
            title: err instanceof Error ? err.message : '操作失败',
            icon: 'none',
          })
        }
      },
    })
  },
})
