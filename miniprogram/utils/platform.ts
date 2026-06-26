import { MINIPROGRAM_APPID, MOBILE_APP_APPID } from '../config/cloud-env'

type HostSystemInfo = WechatMiniprogram.SystemInfo & {
  host?: { env?: string }
  environment?: string
}

/** 是否运行在「多端应用」壳（Android/iOS 安装包），而非微信内小程序 */
export function isMiniAppHost(): boolean {
  try {
    const sys = wx.getSystemInfoSync() as HostSystemInfo
    if (sys.host?.env === 'SAAASDK') return true
    if (sys.environment === 'miniapp') return true
  } catch {
    /* ignore */
  }
  return typeof wx.weixinAppLogin === 'function' && typeof wx.miniapp !== 'undefined'
}

/** 云实例化模式使用的移动应用 AppID */
export function getMobileAppAppId(): string {
  return MOBILE_APP_APPID || MINIPROGRAM_APPID
}

/** 从相册/相机选择头像（多端 App 不支持 chooseAvatar 时使用） */
export function pickAvatarFromAlbum(): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const path = res.tempFiles?.[0]?.tempFilePath
        if (path) {
          resolve(path)
          return
        }
        reject(new Error('未选择图片'))
      },
      fail: (err) => reject(new Error(err.errMsg || '选择图片失败')),
    })
  })
}
