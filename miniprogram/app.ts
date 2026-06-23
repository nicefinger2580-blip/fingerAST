import { getUser } from './utils/auth'
import type { UserProfile } from './utils/types'

App<IAppOption>({
  globalData: {
    user: null as UserProfile | null,
    createFocus: false,
  },
  onLaunch() {
    this.globalData.user = getUser()
    if (wx.cloud) {
      wx.cloud.init({ env: 'finger01-d5giuqcdn273e2cb8', traceUser: true })
    }
  },
  syncUser() {
    this.globalData.user = getUser()
    return this.globalData.user
  },
})
