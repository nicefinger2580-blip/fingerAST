import { getUser, silentLogin, isLoggedOut } from './utils/auth'
import type { UserProfile } from './utils/types'

App<IAppOption>({
  globalData: {
    user: null as UserProfile | null,
    createFocus: false,
  },
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({ env: 'finger01-d5giuqcdn273e2cb8', traceUser: true })
    }
    if (!isLoggedOut()) {
      this.globalData.user = getUser()
      silentLogin().then((user) => {
        if (user) {
          this.globalData.user = user
        }
      })
    }
  },
  syncUser() {
    this.globalData.user = getUser()
    return this.globalData.user
  },
})
