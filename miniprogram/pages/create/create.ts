import { COST, PROMPT_PRESETS, PROMPT_HINT, MAX_PROMPT_LEN } from '../../utils/constants'
import { getUser, requireLogin, saveUser } from '../../utils/auth'
import { callCloud, downloadAndOpenDocx } from '../../utils/cloud'
import type { OutlineNode, UserProfile } from '../../utils/types'

type PageStatus = 'input' | 'loading' | 'result'

Page({
  data: {
    status: 'input' as PageStatus,
    prompt: '',
    charCount: 0,
    maxLen: MAX_PROMPT_LEN,
    promptHint: PROMPT_HINT,
    presets: Object.keys(PROMPT_PRESETS),
    paperTitle: '',
    outline: [] as OutlineNode[],
    paperId: '',
    shared: false,
    expandAll: true,
    costGenerate: COST.generate,
    costExport: COST.exportDocx,
    generating: false,
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

  onPromptInput(e: WechatMiniprogram.Input) {
    const val = (e.detail.value || '').slice(0, MAX_PROMPT_LEN)
    this.setData({ prompt: val, charCount: val.length })
  },

  onPresetTap(e: WechatMiniprogram.TouchEvent) {
    const key = e.currentTarget.dataset.key as string
    const val = PROMPT_PRESETS[key] || ''
    this.setData({ prompt: val, charCount: val.length })
  },

  async onGenerate() {
    if (!requireLogin()) return
    const { prompt, generating } = this.data
    if (generating) return
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

    this.setData({ status: 'loading', generating: true })
    try {
      const data = await callCloud<{
        paperId: string
        prompt: string
        title: string
        outline: OutlineNode[]
        user: UserProfile
      }>('generatePaper', { prompt: prompt.trim() }, { slow: true })

      saveUser(data.user)
      getApp<IAppOption>().globalData.user = data.user
      this.setData({
        status: 'result',
        paperTitle: data.title,
        outline: data.outline,
        paperId: data.paperId,
        shared: false,
        generating: false,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : '生成失败'
      this.setData({ status: 'input', generating: false })
      if (msg.includes('积分不足')) {
        wx.showModal({
          title: '积分不足',
          content: msg,
          confirmText: '去签到',
          confirmColor: '#3B7CFF',
          success(res) {
            if (res.confirm) wx.navigateTo({ url: '/pages/signin/signin' })
          },
        })
      } else {
        wx.showToast({ title: msg, icon: 'none', duration: 2500 })
      }
    }
  },

  onCancelGenerate() {
    if (!this.data.generating) {
      this.setData({ status: 'input' })
    } else {
      wx.showToast({ title: '生成进行中，请稍候', icon: 'none' })
    }
  },

  onRegenerate() {
    wx.showModal({
      title: '重新生成',
      content: `将消耗 ${COST.generate} 积分重新生成，是否继续？`,
      confirmColor: '#3B7CFF',
      success: (res) => {
        if (res.confirm) {
          this.setData({ outline: [], paperId: '', paperTitle: '', shared: false })
          this.onGenerate()
        }
      },
    })
  },

  onToggleExpand() {
    this.setData({ expandAll: !this.data.expandAll })
  },

  onBackToInput() {
    this.setData({
      status: 'input',
      paperTitle: '',
      outline: [],
      paperId: '',
      shared: false,
      expandAll: true,
      generating: false,
    })
  },

  onCheckChange(e: WechatMiniprogram.CustomEvent) {
    const ids = e.detail.value as string[]
    const outline = this.data.outline.map(item => ({
      ...item,
      checked: ids.includes(item.id),
    }))
    this.setData({ outline })
  },

  async onExportDocx() {
    if (!requireLogin()) return
    const { paperId, prompt, outline, paperTitle } = this.data
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
      success: async (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '正在生成文档...' })
        try {
          const data = await callCloud<{ fileID: string; user: UserProfile }>('exportDocx', {
            paperId,
            prompt,
            title: paperTitle || prompt.slice(0, 80),
            outline,
          }, { slow: true })
          saveUser(data.user)
          wx.hideLoading()
          await downloadAndOpenDocx(data.fileID)
          wx.showToast({ title: '导出成功', icon: 'success' })
        } catch (err) {
          wx.hideLoading()
          wx.showToast({
            title: err instanceof Error ? err.message : '导出失败',
            icon: 'none',
            duration: 2500,
          })
        }
      },
    })
  },

  onShareExhibit() {
    if (!requireLogin()) return
    const { paperId, shared } = this.data
    if (!paperId) {
      wx.showToast({ title: '请先生成论文', icon: 'none' })
      return
    }
    if (shared) {
      wx.showToast({ title: '已分享到展览', icon: 'none' })
      return
    }
    wx.showModal({
      title: '分享到展览',
      content: '确认将论文发布至首页展厅？所有用户均可浏览、评论与导出。',
      confirmColor: '#3B7CFF',
      success: async (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '发布中...' })
        try {
          const data = await callCloud<{
            paperId: string
            alreadyShared?: boolean
          }>('exhibit', { action: 'share', paperId })
          wx.hideLoading()
          this.setData({ shared: true })
          wx.showToast({
            title: data.alreadyShared ? '已在展厅展示' : '分享成功',
            icon: 'success',
          })
          setTimeout(() => wx.switchTab({ url: '/pages/home/home' }), 1200)
        } catch (err) {
          wx.hideLoading()
          wx.showToast({
            title: err instanceof Error ? err.message : '分享失败',
            icon: 'none',
          })
        }
      },
    })
  },
})
