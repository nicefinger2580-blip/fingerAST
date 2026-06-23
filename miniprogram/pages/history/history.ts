import { MOCK_HISTORY } from '../../utils/mock'
import type { HistoryItem } from '../../utils/types'

Page({
  data: {
    list: MOCK_HISTORY,
  },

  onView(e: WechatMiniprogram.TouchEvent) {
    wx.navigateTo({ url: '/pages/detail/detail?id=1' })
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
      success: (res) => {
        if (res.confirm) {
          const list = this.data.list.filter(item => item.id !== id)
          this.setData({ list })
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      },
    })
  },
})
