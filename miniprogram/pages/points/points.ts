import { getUser, requireLogin, fetchProfile } from '../../utils/auth'
import { callCloud } from '../../utils/cloud'
import type { PointRecord, UserProfile } from '../../utils/types'

Page({
  data: {
    user: null as UserProfile | null,
    tab: 0,
    earnList: [] as PointRecord[],
    spendList: [] as PointRecord[],
    totalEarn: 0,
    totalSpend: 0,
    loading: true,
  },

  onShow() {
    if (!getUser()?.openid) {
      if (!requireLogin()) {
        this.setData({ loading: false, user: null })
        return
      }
    }
    this.loadRecords()
  },

  async loadRecords() {
    this.setData({ loading: true })
    try {
      const [profile, records] = await Promise.all([
        fetchProfile(),
        callCloud<{
          earnList: PointRecord[]
          spendList: PointRecord[]
          totalEarn: number
          totalSpend: number
        }>('login', { action: 'getPointRecords' }),
      ])
      this.setData({
        user: profile || getUser(),
        earnList: records.earnList,
        spendList: records.spendList,
        totalEarn: records.totalEarn,
        totalSpend: records.totalSpend,
        loading: false,
      })
    } catch (err) {
      this.setData({ loading: false, user: getUser() })
      wx.showToast({
        title: err instanceof Error ? err.message : '加载失败',
        icon: 'none',
      })
    }
  },

  onTabTap(e: WechatMiniprogram.TouchEvent) {
    this.setData({ tab: Number(e.currentTarget.dataset.index) })
  },
})
