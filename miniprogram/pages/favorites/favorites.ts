import { getUser, requireLogin } from '../../utils/auth'
import { callCloud } from '../../utils/cloud'
import type { FavoriteItem } from '../../utils/types'

Page({
  data: {
    list: [] as FavoriteItem[],
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
      const data = await callCloud<{ list: FavoriteItem[] }>('exhibit', {
        action: 'listFavorites',
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

  onView(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}&type=exhibit` })
  },

  async onUnfavorite(e: WechatMiniprogram.TouchEvent) {
    const paperId = e.currentTarget.dataset.id as string
    if (!paperId || !requireLogin()) return
    wx.showModal({
      title: '取消收藏',
      content: '确定取消收藏该模板吗？',
      confirmColor: '#3B7CFF',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await callCloud('exhibit', { action: 'toggleFavorite', paperId })
          this.setData({ list: this.data.list.filter((item) => item.paperId !== paperId) })
          wx.showToast({ title: '已取消收藏', icon: 'none' })
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
