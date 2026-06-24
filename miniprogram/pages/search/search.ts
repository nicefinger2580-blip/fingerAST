import { addSearchHistory, clearSearchHistory, getSearchHistory } from '../../utils/auth'
import { callCloud } from '../../utils/cloud'
import { searchTemplates } from '../../utils/mock'
import type { TemplateItem } from '../../utils/types'

Page({
  data: {
    keyword: '',
    history: [] as string[],
    results: [] as TemplateItem[],
    searched: false,
    searching: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    const kw = options.q || ''
    this.setData({ history: getSearchHistory(), keyword: kw })
    if (kw) this.doSearch(kw)
  },

  onInput(e: WechatMiniprogram.Input) {
    this.setData({ keyword: e.detail.value })
  },

  onClear() {
    this.setData({ keyword: '', results: [], searched: false })
  },

  onSearch() {
    this.doSearch(this.data.keyword)
  },

  async doSearch(keyword: string) {
    const k = keyword.trim()
    if (!k) return
    const history = addSearchHistory(k)
    this.setData({ keyword: k, history, searching: true, searched: true })
    try {
      const data = await callCloud<{ list: TemplateItem[] }>('exhibit', {
        action: 'search',
        keyword: k,
      })
      this.setData({ results: data.list, searching: false })
    } catch {
      this.setData({ results: searchTemplates(k), searching: false })
    }
  },

  onHistoryTap(e: WechatMiniprogram.TouchEvent) {
    const kw = e.currentTarget.dataset.kw as string
    this.setData({ keyword: kw })
    this.doSearch(kw)
  },

  onClearHistory() {
    clearSearchHistory()
    this.setData({ history: [] })
  },

  goDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}&type=exhibit` })
  },
})
