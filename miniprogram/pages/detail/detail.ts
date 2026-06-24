import { COST } from '../../utils/constants'
import { getUser, requireLogin, saveUser } from '../../utils/auth'
import { callCloud, downloadAndOpenDocx } from '../../utils/cloud'
import { getTemplateById } from '../../utils/mock'
import type { CommentItem, OutlineNode, TemplateItem, UserProfile } from '../../utils/types'

Page({
  data: {
    template: null as TemplateItem | null,
    paperId: '',
    paperMode: false,
    exhibitMode: false,
    liked: false,
    loading: true,
    commentInput: '',
    submittingComment: false,
  },

  onLoad(options: { id?: string; type?: string }) {
    if (options.type === 'paper' && options.id) {
      this.loadPaper(options.id)
      return
    }
    if (options.type === 'exhibit' && options.id) {
      this.loadExhibit(options.id)
      return
    }
    const template = getTemplateById(options.id || '1')
    if (template) {
      wx.setNavigationBarTitle({ title: '模板详情' })
      this.setData({ template, paperMode: false, exhibitMode: false, loading: false })
    } else {
      this.setData({ loading: false })
    }
  },

  async loadPaper(paperId: string) {
    wx.setNavigationBarTitle({ title: '创作详情' })
    this.setData({ loading: true, paperMode: true, exhibitMode: false, paperId })
    try {
      const data = await callCloud<{
        paper: {
          id: string
          title: string
          prompt: string
          outline: OutlineNode[]
          createdAt: string
        }
      }>('login', { action: 'getPaper', paperId })
      const user = getUser()
      const { paper } = data
      this.setData({
        template: {
          id: paper.id,
          title: paper.title,
          author: user?.nickName || '我',
          likes: 0,
          createdAt: paper.createdAt,
          theme: 'blue',
          description: paper.prompt,
          outline: paper.outline,
          comments: [],
        },
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

  async loadExhibit(paperId: string) {
    wx.setNavigationBarTitle({ title: '模板详情' })
    this.setData({ loading: true, paperMode: false, exhibitMode: true, paperId })
    try {
      const data = await callCloud<{
        template: TemplateItem
        liked: boolean
      }>('exhibit', { action: 'getDetail', paperId })
      this.setData({
        template: data.template,
        liked: data.liked,
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

  async onLike() {
    if (!this.data.exhibitMode) {
      if (!requireLogin()) return
      this.setData({ liked: !this.data.liked })
      wx.showToast({ title: this.data.liked ? '已点赞' : '已取消', icon: 'none' })
      return
    }
    if (!requireLogin()) return
    const { paperId, template } = this.data
    if (!paperId || !template) return
    try {
      const data = await callCloud<{ liked: boolean; likes: number }>('exhibit', {
        action: 'toggleLike',
        paperId,
      })
      this.setData({
        liked: data.liked,
        template: { ...template, likes: data.likes },
      })
      wx.showToast({ title: data.liked ? '已点赞' : '已取消', icon: 'none' })
    } catch (err) {
      wx.showToast({
        title: err instanceof Error ? err.message : '操作失败',
        icon: 'none',
      })
    }
  },

  onFavorite() {
    if (this.data.paperMode) return
    if (!requireLogin()) return
    wx.showToast({ title: '收藏成功', icon: 'success' })
  },

  onCommentInput(e: WechatMiniprogram.Input) {
    this.setData({ commentInput: (e.detail.value || '').slice(0, 200) })
  },

  async onSubmitComment() {
    if (!this.data.exhibitMode) return
    if (!requireLogin()) return
    const { paperId, template, commentInput, submittingComment } = this.data
    if (submittingComment || !paperId || !template) return
    const content = commentInput.trim()
    if (!content) {
      wx.showToast({ title: '请输入评论', icon: 'none' })
      return
    }
    this.setData({ submittingComment: true })
    try {
      const data = await callCloud<{ comment: CommentItem }>('exhibit', {
        action: 'addComment',
        paperId,
        content,
      })
      const comments = [...(template.comments || []), data.comment]
      this.setData({
        template: { ...template, comments },
        commentInput: '',
        submittingComment: false,
      })
      wx.showToast({ title: '评论成功', icon: 'success' })
    } catch (err) {
      this.setData({ submittingComment: false })
      wx.showToast({
        title: err instanceof Error ? err.message : '评论失败',
        icon: 'none',
      })
    }
  },

  onUseTemplate() {
    if (!requireLogin()) return
    wx.switchTab({ url: '/pages/create/create' })
  },

  onExport() {
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
      success: async (res) => {
        if (!res.confirm) return
        const { template, paperId, paperMode, exhibitMode } = this.data
        if (!template) return
        wx.showLoading({ title: '正在生成文档...' })
        try {
          const payload = (paperMode || exhibitMode) && paperId
            ? { paperId }
            : {
                prompt: template.description || template.title,
                title: template.title,
                outline: template.outline || [],
              }
          const data = await callCloud<{ fileID: string; user: UserProfile }>(
            'exportDocx',
            payload,
            { slow: true },
          )
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
})
