import { getUser } from '../../utils/auth'
import { MOCK_EARN_RECORDS } from '../../utils/mock'
import type { PointRecord } from '../../utils/types'

Page({
  data: {
    user: getUser(),
    tab: 0,
    earnList: MOCK_EARN_RECORDS,
    spendList: [] as PointRecord[],
    totalEarn: 80,
    totalSpend: 60,
  },

  onShow() {
    this.setData({ user: getUser() })
  },

  onTabTap(e: WechatMiniprogram.TouchEvent) {
    this.setData({ tab: Number(e.currentTarget.dataset.index) })
  },
})
