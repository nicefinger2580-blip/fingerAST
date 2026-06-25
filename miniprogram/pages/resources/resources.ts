import { RESOURCE_TABS } from '../../utils/constants'
import { callCloud } from '../../utils/cloud'
import type { ResourceGroup, ResourceItem } from '../../utils/types'

Page({
  data: {
    tabs: RESOURCE_TABS as unknown as string[],
    activeTab: 0,
    list: [] as ResourceItem[],
    groups: [] as ResourceGroup[],
    loading: true,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
    this.loadList(this.data.activeTab)
  },

  async loadList(category: number) {
    this.setData({ loading: true })
    try {
      const data = await callCloud<{ list: ResourceItem[]; groups: ResourceGroup[] }>('resources', {
        action: 'list',
        category,
      })
      this.setData({
        list: data.list,
        groups: data.groups || [],
        loading: false,
      })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({
        title: err instanceof Error ? err.message : '加载失败',
        icon: 'none',
      })
    }
  },

  onTabTap(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index)
    if (index === this.data.activeTab) return
    this.setData({ activeTab: index })
    this.loadList(index)
  },

  onItemTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    if (!id) return
    wx.navigateTo({ url: `/pages/resource-detail/resource-detail?id=${id}` })
  },
})
