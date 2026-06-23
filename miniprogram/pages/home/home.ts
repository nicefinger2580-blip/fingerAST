import { FILTER_TABS } from '../../utils/constants'
import { MOCK_TEMPLATES } from '../../utils/mock'
import { requireLogin } from '../../utils/auth'

Page({
  data: {
    filters: FILTER_TABS as unknown as string[],
    activeFilter: 0,
    templates: MOCK_TEMPLATES,
    leftCol: [] as typeof MOCK_TEMPLATES,
    rightCol: [] as typeof MOCK_TEMPLATES,
    loading: false,
  },

  onLoad() {
    this.splitWaterfall(MOCK_TEMPLATES)
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  splitWaterfall(list: typeof MOCK_TEMPLATES) {
    const left: typeof MOCK_TEMPLATES = []
    const right: typeof MOCK_TEMPLATES = []
    list.forEach((item, i) => (i % 2 === 0 ? left : right).push(item))
    this.setData({ templates: list, leftCol: left, rightCol: right })
  },

  onPullDownRefresh() {
    this.setData({ loading: true })
    setTimeout(() => {
      this.splitWaterfall(MOCK_TEMPLATES)
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    }, 800)
  },

  onFilterTap(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index)
    this.setData({ activeFilter: index })
    let list = [...MOCK_TEMPLATES]
    if (index === 1) list.sort((a, b) => b.likes - a.likes)
    this.splitWaterfall(list)
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/search/search' })
  },

  goDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  onCardLongPress(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    if (!requireLogin()) return
    wx.showActionSheet({
      itemList: ['收藏', '举报'],
      success(res) {
        if (res.tapIndex === 0) {
          wx.showToast({ title: '收藏成功', icon: 'success' })
        } else {
          wx.showToast({ title: '已提交举报', icon: 'none' })
        }
        console.log('template', id)
      },
    })
  },

  goCreate() {
    if (!requireLogin()) return
    const app = getApp<IAppOption>()
    app.globalData.createFocus = true
    wx.switchTab({ url: '/pages/create/create' })
  },
})
