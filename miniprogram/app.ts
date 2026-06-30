import { getUser, silentLogin, isLoggedOut } from './utils/auth'
import { initCloud } from './utils/cloud'
import type { UserProfile } from './utils/types'

App<IAppOption>({
  globalData: {
    user: null as UserProfile | null,
    createFocus: false,
    prefillPrompt: '',
  },
  onLaunch() {
    initCloud()
      .then(() => {
        if (!isLoggedOut()) {
          this.globalData.user = getUser()
          return silentLogin()
        }
        return null
      })
      .then((user) => {
        if (user) {
          this.globalData.user = user
        }
      })
      .catch((err) => {
        console.error('cloud init failed', err)
      })
  },
  syncUser() {
    this.globalData.user = getUser()
    return this.globalData.user
  },
})
