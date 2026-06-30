import { FILTER_TABS } from '../../utils/constants'
import { callCloud } from '../../utils/cloud'
import { requireLogin } from '../../utils/auth'
import { enrichTemplateList } from '../../utils/coverArt'
import type { TemplateItem } from '../../utils/types'

const SORT_MAP = ['latest', 'hot', 'following'] as const

Page({
  data: {
    filters: FILTER_TABS as unknown as string[],
    activeFilter: 0,
    templates: [] as TemplateItem[],
    leftCol: [] as TemplateItem[],
    rightCol: [] as TemplateItem[],
    loading: true,
  },

  onLoad() {
    this.loadTemplates()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    this.loadTemplates()
  },

  splitWaterfall(list: TemplateItem[]) {
    const enriched = enrichTemplateList(list)
    const left: TemplateItem[] = []
    const right: TemplateItem[] = []
    enriched.forEach((item, i) => (i % 2 === 0 ? left : right).push(item))
    this.setData({ templates: enriched, leftCol: left, rightCol: right })
  },

  async loadTemplates() {
    const sort = SORT_MAP[this.data.activeFilter] || 'latest'
    this.setData({ loading: true })
    try {
      const data = await callCloud<{ list: TemplateItem[] }>('exhibit', {
        action: 'list',
        sort,
      })
      this.splitWaterfall(data.list)
      this.setData({ loading: false })
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({
        title: err instanceof Error ? err.message : '加载失败',
        icon: 'none',
      })
    }
  },

  onPullDownRefresh() {
    this.loadTemplates().finally(() => wx.stopPullDownRefresh())
  },

  onFilterTap(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index)
    if (index === 2 && !requireLogin()) return
    this.setData({ activeFilter: index }, () => this.loadTemplates())
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/search/search' })
  },

  goDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}&type=exhibit` })
  },

  onMetaAvatarError(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    const markError = (col: TemplateItem[]) =>
      col.map((item) => (item.id === id ? { ...item, avatarError: true } : item))
    this.setData({
      templates: markError(this.data.templates),
      leftCol: markError(this.data.leftCol),
      rightCol: markError(this.data.rightCol),
    })
  },

  onCardLongPress(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    if (!requireLogin()) return
    wx.showActionSheet({
      itemList: ['收藏', '举报'],
      success: async (res) => {
        if (res.tapIndex === 0) {
          try {
            const data = await callCloud<{ favorited: boolean }>('exhibit', {
              action: 'toggleFavorite',
              paperId: id,
            })
            wx.showToast({
              title: data.favorited ? '收藏成功' : '已取消收藏',
              icon: data.favorited ? 'success' : 'none',
            })
          } catch (err) {
            wx.showToast({
              title: err instanceof Error ? err.message : '收藏失败',
              icon: 'none',
            })
          }
        } else {
          wx.showToast({ title: '已提交举报', icon: 'none' })
        }
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
