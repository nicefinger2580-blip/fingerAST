import { requireLogin } from '../../utils/auth'
import { getTemplateById } from '../../utils/mock'
import type { TemplateItem } from '../../utils/types'

Page({
  data: {
    template: null as TemplateItem | null,
    liked: false,
  },

  onLoad(options: { id?: string }) {
    const template = getTemplateById(options.id || '1')
    if (template) {
      wx.setNavigationBarTitle({ title: '模板详情' })
      this.setData({ template })
    }
  },

  onLike() {
    if (!requireLogin()) return
    this.setData({ liked: !this.data.liked })
    wx.showToast({ title: this.data.liked ? '已点赞' : '已取消', icon: 'none' })
  },

  onFavorite() {
    if (!requireLogin()) return
    wx.showToast({ title: '收藏成功', icon: 'success' })
  },

  onUseTemplate() {
    if (!requireLogin()) return
    wx.switchTab({ url: '/pages/create/create' })
  },

  onExport() {
    if (!requireLogin()) return
    wx.showModal({
      title: '确认导出',
      content: '将消耗 30 积分导出文档，是否继续？',
      confirmColor: '#3B7CFF',
      success(res) {
        if (res.confirm) wx.showToast({ title: '导出成功', icon: 'success' })
      },
    })
  },
})
