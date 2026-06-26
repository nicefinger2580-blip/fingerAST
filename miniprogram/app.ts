import { CLOUD_ENV_ID, MINIPROGRAM_APPID } from './config/cloud-env'
import { getUser, silentLogin, isLoggedOut } from './utils/auth'
import { getMobileAppAppId, isMiniAppHost } from './utils/platform'
import type { UserProfile } from './utils/types'

App<IAppOption>({
  globalData: {
    user: null as UserProfile | null,
    createFocus: false,
    prefillPrompt: '',
  },
  cloudInstance: null,
  cloudReady: false,

  onLaunch() {
    this.initCloud()
    if (!isLoggedOut()) {
      this.globalData.user = getUser()
      silentLogin().then((user) => {
        if (user) {
          this.globalData.user = user
        }
      })
    }
  },

  async initCloud() {
    try {
      if (isMiniAppHost()) {
        if (!wx.cloud?.Cloud) {
          console.error('[cloud] wx.cloud.Cloud 不可用，请检查 project.miniapp.json 是否开启 WeAppNetwork')
          return
        }
        const mobileAppId = getMobileAppAppId()
        this.cloudInstance = new wx.cloud.Cloud({
          appid: mobileAppId,
          resourceAppid: MINIPROGRAM_APPID,
          resourceEnv: CLOUD_ENV_ID,
        })
        // 多端 App 需登录后再 init；此处尝试预 init（未登录模式需控制台开启）
        try {
          await this.cloudInstance.init()
          this.cloudReady = true
        } catch (err) {
          console.warn('[cloud] 预初始化失败，登录后将重试', err)
        }
        return
      }

      if (wx.cloud) {
        wx.cloud.init({ env: CLOUD_ENV_ID, traceUser: true })
        this.cloudReady = true
      }
    } catch (err) {
      console.error('[cloud] init failed', err)
    }
  },

  /** 多端 App 微信登录成功后调用，建立云开发登录态 */
  async ensureCloudSession(): Promise<void> {
    if (!isMiniAppHost()) return
    const app = this
    if (!app.cloudInstance) {
      await app.initCloud()
    }
    if (!app.cloudInstance) {
      throw new Error('云开发实例创建失败')
    }
    await app.cloudInstance.init()
    app.cloudReady = true
  },

  syncUser() {
    this.globalData.user = getUser()
    return this.globalData.user
  },
})
