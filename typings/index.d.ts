/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    user: import('./utils/types').UserProfile | null
    createFocus: boolean
    prefillPrompt: string
  }
  syncUser: () => import('./utils/types').UserProfile | null
}
