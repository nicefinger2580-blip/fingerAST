import { getUser, requireLogin, fetchProfile, saveUser } from '../../utils/auth'
import { callCloud } from '../../utils/cloud'
import { RECHARGE_PACKS } from '../../utils/constants'
import type { PointRecord, UserProfile } from '../../utils/types'

interface RechargePack {
  id: string
  priceYuan: number
  points: number
  label: string
}

Page({
  data: {
    user: null as UserProfile | null,
    tab: 0,
    earnList: [] as PointRecord[],
    spendList: [] as PointRecord[],
    totalEarn: 0,
    totalSpend: 0,
    loading: true,
    showRecharge: false,
    paying: false,
    packs: RECHARGE_PACKS as unknown as RechargePack[],
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

  onOpenRecharge() {
    if (!requireLogin()) return
    this.setData({ showRecharge: true })
  },

  onCloseRecharge() {
    if (this.data.paying) return
    this.setData({ showRecharge: false })
  },

  noop() {},

  async onSelectPack(e: WechatMiniprogram.TouchEvent) {
    const packId = e.currentTarget.dataset.id as string
    if (!packId || this.data.paying) return
    if (!requireLogin()) return

    this.setData({ paying: true })
    wx.showLoading({ title: '正在下单...' })

    try {
      const order = await callCloud<{
        payment: WechatMiniprogram.RequestPaymentOption
        outTradeNo: string
        points: number
      }>('pay', { action: 'createOrder', packId })

      wx.hideLoading()

      await new Promise<void>((resolve, reject) => {
        wx.requestPayment({
          ...order.payment,
          success: () => resolve(),
          fail: (err) => {
            const msg = err.errMsg || '支付失败'
            if (msg.includes('cancel') || msg.includes('取消')) {
              reject(new Error('USER_CANCEL'))
            } else {
              reject(new Error(msg))
            }
          },
        })
      })

      wx.showLoading({ title: '确认到账...' })
      const result = await callCloud<{
        status: string
        points: number
        user: UserProfile
      }>('pay', { action: 'queryOrder', outTradeNo: order.outTradeNo })

      wx.hideLoading()

      if (result.status === 'paid' && result.user) {
        saveUser(result.user)
        this.setData({ user: result.user, showRecharge: false, paying: false })
        await this.loadRecords()
        wx.showToast({ title: `充值成功 +${result.points}积分`, icon: 'success' })
        return
      }

      this.setData({ paying: false })
      wx.showModal({
        title: '支付处理中',
        content: '支付已完成，积分可能稍有延迟到账，请稍后刷新页面查看。',
        showCancel: false,
      })
    } catch (err) {
      wx.hideLoading()
      this.setData({ paying: false })
      const msg = err instanceof Error ? err.message : '充值失败'
      if (msg === 'USER_CANCEL') return
      wx.showModal({
        title: '充值失败',
        content: msg,
        showCancel: false,
      })
    }
  },
})
