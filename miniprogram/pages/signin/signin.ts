import { COST } from '../../utils/constants'
import { getUser, hasSignedToday, saveUser, todayStr } from '../../utils/auth'

interface CalendarDay {
  day: number
  signed: boolean
  today: boolean
  empty?: boolean
}

Page({
  data: {
    signedDays: 0,
    signedToday: false,
    year: 2025,
    month: 6,
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    calendar: [] as CalendarDay[],
    reward: COST.signinReward,
    showToast: false,
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const user = getUser()
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const signedDates = user?.signedDates || []
    const calendar = this.buildCalendar(year, month, signedDates)
    this.setData({
      signedDays: user?.signedDays || 0,
      signedToday: user ? hasSignedToday(user) : false,
      year,
      month,
      calendar,
    })
  },

  buildCalendar(year: number, month: number, signedDates: string[]): CalendarDay[] {
    const firstDay = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    const today = todayStr()
    const cells: CalendarDay[] = []
    for (let i = 0; i < firstDay; i++) cells.push({ day: 0, signed: false, today: false, empty: true })
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({
        day: d,
        signed: signedDates.includes(ds),
        today: ds === today,
      })
    }
    return cells
  },

  onSignin() {
    const user = getUser()
    if (!user) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (hasSignedToday(user)) {
      wx.showToast({ title: '今日已签到', icon: 'none' })
      return
    }
    const today = todayStr()
    user.points += COST.signinReward
    user.signedDays += 1
    user.signedDates = [...user.signedDates, today]
    saveUser(user)
    this.setData({ showToast: true, signedToday: true })
    this.refresh()
    setTimeout(() => this.setData({ showToast: false }), 2000)
  },
})
