import { COST, PROMPT_PRESETS } from '../../utils/constants'
import { generateOutline } from '../../utils/mock'
import { getUser, requireLogin, updatePoints } from '../../utils/auth'
import type { OutlineNode } from '../../utils/types'

type PageStatus = 'input' | 'loading' | 'result'

Page({
  data: {
    status: 'input' as PageStatus,
    prompt: '',
    charCount: 0,
    maxLen: 500,
    presets: Object.keys(PROMPT_PRESETS),
    outline: [] as OutlineNode[],
    expandAll: true,
    costGenerate: COST.generate,
    costExport: COST.exportDocx,
    generateTimer: 0 as number | ReturnType<typeof setTimeout>,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
    const app = getApp<IAppOption>()
    if (app.globalData.createFocus) {
      app.globalData.createFocus = false
    }
  },

  onUnload() {
    this.clearGenerateTimer()
  },

  clearGenerateTimer() {
    if (this.data.generateTimer) {
      clearTimeout(this.data.generateTimer as ReturnType<typeof setTimeout>)
    }
  },

  onPromptInput(e: WechatMiniprogram.Input) {
    const val = (e.detail.value || '').slice(0, 500)
    this.setData({ prompt: val, charCount: val.length })
  },

  onPresetTap(e: WechatMiniprogram.TouchEvent) {
    const key = e.currentTarget.dataset.key as string
    const val = PROMPT_PRESETS[key] || ''
    this.setData({ prompt: val, charCount: val.length })
  },

  onGenerate() {
    if (!requireLogin()) return
    const { prompt } = this.data
    if (!prompt.trim()) {
      wx.showToast({ title: '请输入提示词', icon: 'none' })
      return
    }
    const user = getUser()
    if (!user || user.points < COST.generate) {
      wx.showModal({
        title: '积分不足',
        content: '积分不足，请签到或获取积分',
        confirmText: '去签到',
        confirmColor: '#3B7CFF',
        success(res) {
          if (res.confirm) wx.navigateTo({ url: '/pages/signin/signin' })
        },
      })
      return
    }
    updatePoints(-COST.generate)
    this.setData({ status: 'loading' })
    const timer = setTimeout(() => {
      const outline = generateOutline(prompt)
      this.setData({ status: 'result', outline, generateTimer: 0 })
    }, 3000)
    this.setData({ generateTimer: timer as unknown as number })
  },

  onCancelGenerate() {
    this.clearGenerateTimer()
    updatePoints(COST.generate)
    this.setData({ status: 'input', generateTimer: 0 })
    wx.showToast({ title: '已取消生成', icon: 'none' })
  },

  onRegenerate() {
    wx.showModal({
      title: '重新生成',
      content: `将消耗 ${COST.generate} 积分重新生成，是否继续？`,
      confirmColor: '#3B7CFF',
      success: (res) => {
        if (res.confirm) {
          this.setData({ status: 'input', outline: [] })
          this.onGenerate()
        }
      },
    })
  },

  onToggleExpand() {
    this.setData({ expandAll: !this.data.expandAll })
  },

  onCheckChange(e: WechatMiniprogram.CustomEvent) {
    const ids = e.detail.value as string[]
    const outline = this.data.outline.map(item => ({
      ...item,
      checked: ids.includes(item.id),
    }))
    this.setData({ outline })
  },

  onExportDocx() {
    if (!requireLogin()) return
    const user = getUser()
    if (!user || user.points < COST.exportDocx) {
      wx.showModal({
        title: '积分不足',
        content: '导出需要 30 积分，是否前往签到？',
        confirmText: '去签到',
        confirmColor: '#3B7CFF',
        success(res) {
          if (res.confirm) wx.navigateTo({ url: '/pages/signin/signin' })
        },
      })
      return
    }
    wx.showModal({
      title: '确认导出',
      content: '将消耗 30 积分导出文档，是否继续？',
      confirmColor: '#3B7CFF',
      success: (res) => {
        if (res.confirm) {
          updatePoints(-COST.exportDocx)
          wx.showToast({ title: '导出成功', icon: 'success' })
        }
      },
    })
  },

  onShareExhibit() {
    if (!requireLogin()) return
    wx.showModal({
      title: '分享到展览',
      content: '确认将模板发布至首页广场？',
      confirmColor: '#3B7CFF',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '分享成功', icon: 'success' })
          setTimeout(() => wx.switchTab({ url: '/pages/home/home' }), 1200)
        }
      },
    })
  },
})
