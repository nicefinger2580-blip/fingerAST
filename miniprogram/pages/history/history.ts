import { getUser, requireLogin, fetchProfile } from '../../utils/auth'
import { callCloud } from '../../utils/cloud'
import type { HistoryItem } from '../../utils/types'

Page({
  data: {
    list: [] as HistoryItem[],
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
      const data = await callCloud<{ list: HistoryItem[] }>('login', { action: 'getPapers' })
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
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}&type=paper` })
  },

  onRegenerate() {
    wx.switchTab({ url: '/pages/create/create' })
  },

  onDelete(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，是否继续？',
      confirmColor: '#3B7CFF',
      success: async (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '删除中...' })
        try {
          await callCloud('login', { action: 'deletePaper', paperId: id })
          await fetchProfile()
          this.setData({ list: this.data.list.filter(item => item.id !== id) })
          wx.showToast({ title: '已删除', icon: 'success' })
        } catch (err) {
          wx.showToast({
            title: err instanceof Error ? err.message : '删除失败',
            icon: 'none',
          })
        } finally {
          wx.hideLoading()
        }
      },
    })
  },
})
