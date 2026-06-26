/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    user: import('./utils/types').UserProfile | null
    createFocus: boolean
    prefillPrompt: string
  }
  cloudInstance: WechatMiniprogram.Cloud | null
  cloudReady: boolean
  initCloud: () => void | Promise<void>
  ensureCloudSession: () => Promise<void>
  syncUser: () => import('./utils/types').UserProfile | null
}
