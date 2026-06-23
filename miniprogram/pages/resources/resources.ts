import { RESOURCE_TABS } from '../../utils/constants'
import { MOCK_RESOURCES } from '../../utils/mock'

Page({
  data: {
    tabs: RESOURCE_TABS as unknown as string[],
    activeTab: 0,
    list: MOCK_RESOURCES.filter(r => r.category === 0),
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  onTabTap(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index)
    const list = MOCK_RESOURCES.filter(r => r.category === index)
    this.setData({ activeTab: index, list })
  },

  onItemTap() {
    wx.showToast({ title: '资源链接预览', icon: 'none' })
  },
})
