import { callCloud } from '../../utils/cloud'
import { markdownToHtml } from '../../utils/markdown'
import type { ResourceItem } from '../../utils/types'

Page({
  data: {
    item: null as ResourceItem | null,
    html: '',
    loading: true,
    mode: 'tutorial' as 'tutorial' | 'prompt' | 'link',
  },

  onLoad(options: { id?: string }) {
    if (!options.id) {
      this.setData({ loading: false })
      return
    }
    this.loadDetail(options.id)
  },

  async loadDetail(id: string) {
    this.setData({ loading: true })
    try {
      const data = await callCloud<{ item: ResourceItem }>('resources', {
        action: 'getDetail',
        id,
      })
      const item = data.item
      let mode: 'tutorial' | 'prompt' | 'link' = 'link'
      if (item.category === 2 || (item.subType === 'tutorial' && item.content)) {
        mode = 'tutorial'
      } else if (item.subType === 'prompt' && item.content) {
        mode = 'prompt'
      }
      this.setData({
        item,
        html: mode === 'tutorial' ? markdownToHtml(item.content || '') : '',
        mode,
        loading: false,
      })
      wx.setNavigationBarTitle({ title: item.title.slice(0, 12) })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({
        title: err instanceof Error ? err.message : '加载失败',
        icon: 'none',
      })
    }
  },

  onCopyContent() {
    const { item, mode } = this.data
    const text = mode === 'prompt' ? item?.content : item?.url
    if (!text) return
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    })
  },

  onCopyUrl() {
    const url = this.data.item?.url
    if (!url) return
    wx.setClipboardData({
      data: url,
      success: () => wx.showToast({ title: '链接已复制', icon: 'success' }),
    })
  },

  onUsePrompt() {
    const content = this.data.item?.content
    if (!content) return
    const app = getApp<IAppOption>()
    app.globalData.createFocus = true
    app.globalData.prefillPrompt = content
    wx.switchTab({ url: '/pages/create/create' })
  },
})
