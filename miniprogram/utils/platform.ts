/** 是否运行在 Android/iOS 多端 App 壳（非微信内小程序） */
export function isMiniApp(): boolean {
  try {
    const info = wx.getSystemInfoSync() as WechatMiniprogram.SystemInfo & {
      uniPlatform?: string
      host?: { env?: string }
    }
    if (info.uniPlatform === 'app') return true
    const hostEnv = info.host?.env
    if (hostEnv && hostEnv !== 'WeChat') return true
  } catch {
    /* ignore */
  }
  return false
}

/** 从相册/相机选择头像（多端 App 不支持 chooseAvatar） */
export function pickAvatarImage(): Promise<string> {
  return new Promise((resolve, reject) => {
    const onSuccess = (tempPath: string) => {
      if (tempPath) resolve(tempPath)
      else reject(new Error('未选择图片'))
    }

    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
        success: (res) => onSuccess(res.tempFiles?.[0]?.tempFilePath || ''),
        fail: (err) => reject(new Error(err.errMsg || '选择图片失败')),
      })
      return
    }

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => onSuccess(res.tempFilePaths?.[0] || ''),
      fail: (err) => reject(new Error(err.errMsg || '选择图片失败')),
    })
  })
}
