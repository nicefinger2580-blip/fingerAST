import { getUser, requireLogin } from '../../utils/auth'
import { callCloud } from '../../utils/cloud'
import type { TemplateItem, UserPublicProfile } from '../../utils/types'

Page({
  data: {
    profile: null as UserPublicProfile | null,
    activeTab: 0,
    createdList: [] as TemplateItem[],
    likedList: [] as TemplateItem[],
    loading: true,
    listLoading: false,
    followingLoading: false,
    avatarError: false,
    targetOpenid: '',
  },

  onLoad(options: { openid?: string }) {
    const targetOpenid = decodeURIComponent(options.openid || '').trim()
    if (!targetOpenid) {
      wx.showToast({ title: '用户不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.setData({ targetOpenid })
    this.loadProfile()
  },

  async loadProfile() {
    const { targetOpenid } = this.data
    if (!targetOpenid) return
    this.setData({ loading: true, avatarError: false })
    try {
      const data = await callCloud<{ profile: UserPublicProfile }>('login', {
        action: 'getUserPublicProfile',
        targetOpenid,
      })
      wx.setNavigationBarTitle({
        title: data.profile.isSelf ? '我的主页' : data.profile.nickName,
      })
      this.setData({ profile: data.profile, loading: false })
      this.loadTabList(this.data.activeTab)
    } catch (err) {
      this.setData({ loading: false })
      wx.showToast({
        title: err instanceof Error ? err.message : '加载失败',
        icon: 'none',
      })
    }
  },

  async loadTabList(tab: number) {
    const { targetOpenid } = this.data
    if (!targetOpenid) return
    this.setData({ listLoading: true })
    try {
      if (tab === 0) {
        const data = await callCloud<{ list: TemplateItem[] }>('exhibit', {
          action: 'listUserShared',
          userOpenid: targetOpenid,
        })
        this.setData({ createdList: data.list, listLoading: false })
        return
      }
      const data = await callCloud<{ list: TemplateItem[] }>('exhibit', {
        action: 'listUserLiked',
        userOpenid: targetOpenid,
      })
      this.setData({ likedList: data.list, listLoading: false })
    } catch (err) {
      this.setData({ listLoading: false })
      wx.showToast({
        title: err instanceof Error ? err.message : '加载失败',
        icon: 'none',
      })
    }
  },

  onTabTap(e: WechatMiniprogram.TouchEvent) {
    const tab = Number(e.currentTarget.dataset.tab)
    if (tab === this.data.activeTab) return
    this.setData({ activeTab: tab })
    const { createdList, likedList } = this.data
    if ((tab === 0 && createdList.length === 0) || (tab === 1 && likedList.length === 0)) {
      this.loadTabList(tab)
    }
  },

  onAvatarError() {
    this.setData({ avatarError: true })
  },

  async onToggleFollow() {
    const { profile, targetOpenid } = this.data
    if (!profile || profile.isSelf) return
    if (!requireLogin()) return
    this.setData({ followingLoading: true })
    try {
      const data = await callCloud<{ following: boolean; followerCount: number }>('login', {
        action: 'toggleFollow',
        targetOpenid,
      })
      this.setData({
        profile: {
          ...profile,
          following: data.following,
          followerCount: data.followerCount,
        },
        followingLoading: false,
      })
      wx.showToast({
        title: data.following ? '关注成功' : '已取消关注',
        icon: data.following ? 'success' : 'none',
      })
    } catch (err) {
      this.setData({ followingLoading: false })
      wx.showToast({
        title: err instanceof Error ? err.message : '操作失败',
        icon: 'none',
      })
    }
  },

  onGoFollowing() {
    const { profile } = this.data
    if (!profile?.isSelf) return
    if (!requireLogin()) return
    wx.navigateTo({ url: '/pages/following/following' })
  },

  onViewPaper(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}&type=exhibit` })
  },
})
